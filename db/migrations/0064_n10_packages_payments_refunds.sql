-- N10 Packages, Payments & Refunds. Additive migration; apply after 0063.
ALTER TABLE public.platform_reviewers DROP CONSTRAINT IF EXISTS platform_reviewers_role_code_check;
ALTER TABLE public.platform_reviewers ADD CONSTRAINT platform_reviewers_role_code_check
 CHECK(role_code IN ('APPLICATION_REVIEWER','EVIDENCE_VERIFIER','PROVIDER_OPERATOR','FINANCE_REVIEWER','PLATFORM_ADMIN'));

CREATE TABLE IF NOT EXISTS public.service_packages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 package_code text NOT NULL UNIQUE,
 display_name text NOT NULL,
 currency char(3) NOT NULL DEFAULT 'ZAR' CHECK(currency='ZAR'),
 price_minor integer NOT NULL CHECK(price_minor>=0),
 active boolean NOT NULL DEFAULT true,
 entitlement_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.service_packages(package_code,display_name,price_minor,entitlement_snapshot) VALUES
 ('FOUNDATIONAL_ACCORD','Foundational Accord',16999,'{"managed_applications":1}'::jsonb),
 ('COLLEGIATE_ORDINANCE','Collegiate Ordinance',29999,'{"managed_applications":2}'::jsonb),
 ('CHANCELLORS_WRIT','Chancellor''s Writ',39999,'{"managed_applications":3}'::jsonb),
 ('REGENCY_MANDATE','Regency Mandate',46999,'{"managed_applications":4}'::jsonb),
 ('ARTISAN_CHARTER','Artisan Charter',14999,'{"service":"artisan_charter"}'::jsonb),
 ('GUILDMASTERS_CHARTER','Guildmaster''s Charter',19999,'{"service":"guildmasters_charter"}'::jsonb),
 ('CV_REVAMP','CV Revamp',4999,'{"service":"cv_revamp","upgrade_bonus_active_routes":2}'::jsonb)
ON CONFLICT(package_code) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.candidate_service_orders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 order_ref text NOT NULL UNIQUE,
 candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE RESTRICT,
 package_id uuid NOT NULL REFERENCES public.service_packages(id) ON DELETE RESTRICT,
 package_code text NOT NULL, package_name text NOT NULL,
 currency char(3) NOT NULL DEFAULT 'ZAR' CHECK(currency='ZAR'),
 amount_minor integer NOT NULL CHECK(amount_minor>=0),
 entitlement_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
 status text NOT NULL DEFAULT 'PENDING_PAYMENT' CHECK(status IN ('PENDING_PAYMENT','PAID','PAYMENT_FAILED','CANCELLED','REFUND_REQUESTED','PARTIALLY_REFUNDED','REFUNDED')),
 idempotency_key text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 paid_at timestamptz, cancelled_at timestamptz,
 UNIQUE(candidate_id,idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_n10_orders_candidate ON public.candidate_service_orders(candidate_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_n10_orders_status ON public.candidate_service_orders(status,created_at);

CREATE TABLE IF NOT EXISTS public.candidate_payment_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 event_ref text NOT NULL UNIQUE,
 order_id uuid NOT NULL REFERENCES public.candidate_service_orders(id) ON DELETE RESTRICT,
 candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE RESTRICT,
 event_type text NOT NULL CHECK(event_type IN ('ORDER_CREATED','PAYMENT_INITIATION_REQUESTED','PAYMENT_CONFIRMED','PAYMENT_FAILED','REFUND_REQUESTED','REFUND_APPROVED','REFUND_REJECTED','REFUND_COMPLETED','ORDER_CANCELLED')),
 source text NOT NULL CHECK(source IN ('SYSTEM','VERIFIED_PROVIDER_WEBHOOK','FINANCE_MANUAL_REVIEW','CANDIDATE')),
 amount_minor integer CHECK(amount_minor IS NULL OR amount_minor>=0),
 provider text, provider_event_id text, provider_reference text,
 evidence_locator text, evidence_sha256 text, note text,
 actor_auth_user_id uuid, idempotency_key text UNIQUE,
 metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(evidence_sha256 IS NULL OR evidence_sha256 ~ '^[a-fA-F0-9]{64}$')
);
CREATE INDEX IF NOT EXISTS idx_n10_payment_events_order ON public.candidate_payment_events(order_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_n10_payment_events_candidate ON public.candidate_payment_events(candidate_id,created_at DESC);

CREATE TABLE IF NOT EXISTS public.candidate_refund_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 refund_ref text NOT NULL UNIQUE,
 order_id uuid NOT NULL REFERENCES public.candidate_service_orders(id) ON DELETE RESTRICT,
 candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE RESTRICT,
 amount_minor integer NOT NULL CHECK(amount_minor>0),
 reason text NOT NULL CHECK(length(reason) BETWEEN 20 AND 3000),
 status text NOT NULL DEFAULT 'REQUESTED' CHECK(status IN ('REQUESTED','UNDER_REVIEW','APPROVED','REJECTED','COMPLETED')),
 candidate_idempotency_key text NOT NULL,
 reviewer_auth_user_id uuid, reviewer_note text, reviewed_at timestamptz,
 completed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(candidate_id,candidate_idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_n10_refunds_queue ON public.candidate_refund_requests(status,created_at);
CREATE INDEX IF NOT EXISTS idx_n10_refunds_candidate ON public.candidate_refund_requests(candidate_id,created_at DESC);

CREATE TABLE IF NOT EXISTS public.finance_audit_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 event_ref text NOT NULL UNIQUE,
 actor_auth_user_id uuid NOT NULL,
 actor_role text NOT NULL CHECK(actor_role IN ('CANDIDATE','FINANCE_REVIEWER','PLATFORM_ADMIN')),
 action text NOT NULL,
 entity_type text NOT NULL CHECK(entity_type IN ('ORDER','PAYMENT_EVENT','REFUND')),
 entity_id uuid NOT NULL,
 before_snapshot jsonb, after_snapshot jsonb,
 reason text,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_n10_finance_audit_entity ON public.finance_audit_events(entity_type,entity_id,created_at DESC);

CREATE OR REPLACE FUNCTION public.n10_prevent_finance_audit_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'FINANCE_AUDIT_IMMUTABLE'; END;
$$;
DROP TRIGGER IF EXISTS trg_n10_finance_audit_immutable ON public.finance_audit_events;
CREATE TRIGGER trg_n10_finance_audit_immutable BEFORE UPDATE OR DELETE ON public.finance_audit_events
FOR EACH ROW EXECUTE FUNCTION public.n10_prevent_finance_audit_mutation();

ALTER TABLE public.service_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_refund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_audit_events ENABLE ROW LEVEL SECURITY;
-- All writes/reads in this initial slice are server-mediated through authenticated APIs.
-- No anon/authenticated policies are added; service-role credentials must remain server-side.
