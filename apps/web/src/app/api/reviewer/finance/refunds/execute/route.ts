import { requireReviewerSession, reviewerFetch, reviewerFail } from "../../../../../../lib/n07-reviewer-runtime";
import { getPayFastRuntime, payFastApiHeaders, sha256Hex } from "../../../../../../lib/payfast-runtime";

const fail = (status:number, code:string, error:string) => reviewerFail(status,code,error);
const minor = (value:unknown) => Number.isSafeInteger(Number(value)) ? Number(value) : null;

function apiUrl(runtime:NonNullable<ReturnType<typeof getPayFastRuntime>>, path:string) {
  return runtime.apiBaseUrl + path + (runtime.environment === "sandbox" ? (path.includes("?") ? "&" : "?") + "testing=true" : "");
}
function refundLedger(payload:any):{transactions:Array<{amount:unknown;type?:string}>;raw:unknown}|null {
  const candidate = payload?.data?.response || payload?.response || payload;
  return candidate && Array.isArray(candidate.transactions) ? { transactions:candidate.transactions, raw:candidate } : null;
}

export async function POST(request:Request) {
  const auth = await requireReviewerSession(request,["FINANCE_REVIEWER"]);
  if (!auth.ok) return fail(auth.status,auth.code,auth.message);
  const runtime = getPayFastRuntime();
  if (!runtime) return fail(503,"PAYFAST_NOT_CONFIGURED","PayFast API credentials and ITN source allowlist are not configured.");

  let input:unknown;
  try { input = await request.json(); } catch { return fail(400,"INVALID_JSON","Send valid JSON."); }
  const body = input && typeof input === "object" ? input as Record<string,unknown> : {};
  const refundId = typeof body.refundId === "string" ? body.refundId.trim() : "";
  if (!/^[0-9a-f-]{36}$/i.test(refundId)) return fail(400,"REFUND_ID_REQUIRED","A valid refund request ID is required.");

  try {
    const refundUrl = new URL(auth.session.config.url + "/rest/v1/candidate_refund_requests");
    refundUrl.searchParams.set("select","id,refund_ref,order_id,candidate_id,amount_minor,reason,status,reviewer_auth_user_id");
    refundUrl.searchParams.set("id","eq."+refundId);
    refundUrl.searchParams.set("limit","2");
    const refundResponse = await reviewerFetch(auth.session,"/rest/v1/candidate_refund_requests?"+refundUrl.searchParams.toString());
    if (!refundResponse.ok) return fail(502,"REFUND_LOOKUP_FAILED","Refund request could not be loaded.");
    const refunds = await refundResponse.json() as Array<Record<string,unknown>>;
    if (!Array.isArray(refunds)||refunds.length!==1) return fail(404,"REFUND_NOT_FOUND","Refund request was not found.");
    const refund = refunds[0];
    if (refund.status!=="APPROVED" && refund.status!=="PROCESSING") return fail(409,"REFUND_STATE_BLOCKED","Refund must be approved; processing refunds can only be reconciled, never submitted twice.");
    const amountMinor = minor(refund.amount_minor);
    if (amountMinor===null||amountMinor<1) return fail(409,"REFUND_AMOUNT_INVALID","Refund amount is invalid.");

    const orderUrl = new URL(auth.session.config.url + "/rest/v1/candidate_service_orders");
    orderUrl.searchParams.set("select","id,order_ref,candidate_id,amount_minor,currency,status");
    orderUrl.searchParams.set("id","eq."+String(refund.order_id));
    orderUrl.searchParams.set("limit","2");
    const orderResponse = await reviewerFetch(auth.session,"/rest/v1/candidate_service_orders?"+orderUrl.searchParams.toString());
    if (!orderResponse.ok) return fail(502,"ORDER_LOOKUP_FAILED","Order could not be loaded.");
    const orders = await orderResponse.json() as Array<Record<string,unknown>>;
    if (!Array.isArray(orders)||orders.length!==1) return fail(404,"ORDER_NOT_FOUND","Order was not found.");
    const order = orders[0];
    if (order.currency!=="ZAR"||order.candidate_id!==refund.candidate_id) return fail(409,"ORDER_REFUND_MISMATCH","Refund and order identity or currency do not match.");

    const paymentUrl = new URL(auth.session.config.url + "/rest/v1/candidate_payment_events");
    paymentUrl.searchParams.set("select","id,order_id,candidate_id,amount_minor,provider_reference,metadata");
    paymentUrl.searchParams.set("order_id","eq."+String(order.id));
    paymentUrl.searchParams.set("event_type","eq.PAYMENT_CONFIRMED");
    paymentUrl.searchParams.set("source","eq.VERIFIED_PROVIDER_WEBHOOK");
    paymentUrl.searchParams.set("provider","eq.PAYFAST");
    paymentUrl.searchParams.set("order","created_at.desc");
    paymentUrl.searchParams.set("limit","2");
    const paymentResponse = await reviewerFetch(auth.session,"/rest/v1/candidate_payment_events?"+paymentUrl.searchParams.toString());
    if (!paymentResponse.ok) return fail(502,"PAYMENT_LOOKUP_FAILED","Verified PayFast payment event could not be loaded.");
    const payments = await paymentResponse.json() as Array<Record<string,unknown>>;
    if (!Array.isArray(payments)||payments.length!==1) return fail(409,"VERIFIED_PAYMENT_REQUIRED","A unique verified PayFast payment event is required.");
    const payment = payments[0];
    const providerPaymentId = typeof payment.provider_reference==="string" ? payment.provider_reference : "";
    if (!providerPaymentId||Number(payment.amount_minor)!==Number(order.amount_minor)) return fail(409,"PAYMENT_ORDER_MISMATCH","Verified payment does not match the order.");

    const queryUrl = apiUrl(runtime,"/refunds/query/"+encodeURIComponent(providerPaymentId));
    const preflightResponse = await fetch(queryUrl,{method:"GET",headers:payFastApiHeaders(runtime),cache:"no-store",signal:AbortSignal.timeout(10000)});
    if (!preflightResponse.ok) return fail(502,"PAYFAST_REFUND_PREFLIGHT_FAILED","PayFast could not confirm refund eligibility.");
    const preflight = await preflightResponse.json() as any;
    const available = minor(preflight?.amount_available_for_refund);
    if (preflight?.status!=="REFUNDABLE"||available===null||available<amountMinor) {
      return fail(409,"PAYFAST_REFUND_NOT_AVAILABLE","PayFast reports that the requested amount is not currently refundable.");
    }
    const original = minor(preflight?.amount_original);
    if (original===null || original<amountMinor) return fail(409,"PAYFAST_ORIGINAL_AMOUNT_INVALID","PayFast returned an invalid original transaction amount.");
    const expectedProviderRefundTotal = original - available + amountMinor;
    const method = original===amountMinor ? preflight?.refund_full?.method : preflight?.refund_partial?.method;
    if (method!=="PAYMENT_SOURCE") {
      return fail(409,"PAYFAST_REFUND_METHOD_UNSUPPORTED","PayFast does not offer a payment-source refund for this request. A separately approved secure bank-payout workflow is required.");
    }

    if (refund.status==="APPROVED") {
      const claim = await reviewerFetch(auth.session,"/rest/v1/rpc/n10_claim_payfast_refund",{
        method:"POST",headers:{"content-type":"application/json"},
        body:JSON.stringify({p_refund_id:refund.id,p_actor_auth_user_id:auth.session.userId,p_idempotency_key:"payfast-refund-claim:"+refund.id})
      });
      if (!claim.ok) return fail(409,"REFUND_CLAIM_FAILED","Refund could not be atomically claimed for one-time execution.");
      const claimRows = await claim.json() as Array<{refund_status?:string;claimed?:boolean}>;
      if (!Array.isArray(claimRows)||claimRows.length!==1||claimRows[0].claimed!==true) {
        return fail(409,"REFUND_ALREADY_CLAIMED","This refund has already been claimed; it will not be submitted a second time. Retry reconciliation only.");
      }

      const bodyFields = {
        amount:String(amountMinor),
        reason:String(refund.reason||"Approved Kingsmen refund").slice(0,255),
        notify_buyer:"true",
        notify_merchant:"true"
      };
      const headers = payFastApiHeaders(runtime,bodyFields);
      const createResponse = await fetch(apiUrl(runtime,"/refunds/"+encodeURIComponent(providerPaymentId)),{
        method:"POST",headers,body:JSON.stringify({
          amount:bodyFields.amount,reason:bodyFields.reason,notify_buyer:true,notify_merchant:true
        }),cache:"no-store",signal:AbortSignal.timeout(15000)
      });
      const createJson = await createResponse.json().catch(()=>null) as any;
      const accepted = createResponse.ok && createJson?.status==="success" &&
        (createJson?.data?.response===true||createJson?.data?.response?.response===true);
      if (!accepted) {
        // Leave PROCESSING. Do not automatically retry a provider operation with uncertain outcome.
        return Response.json({ok:false,productionReady:false,code:"PAYFAST_REFUND_SUBMISSION_UNCERTAIN",error:"PayFast did not return a conclusive success response. The refund remains PROCESSING and must be reconciled; it will not be resubmitted automatically."},{status:502,headers:{"cache-control":"no-store"}});
      }
    }

    // Query the provider ledger after submission, or on retry for an already PROCESSING refund.
    const ledgerResponse = await fetch(apiUrl(runtime,"/refunds/"+encodeURIComponent(providerPaymentId)),{
      method:"GET",headers:payFastApiHeaders(runtime),cache:"no-store",signal:AbortSignal.timeout(10000)
    });
    if (!ledgerResponse.ok) return Response.json({ok:false,productionReady:false,code:"PAYFAST_RECONCILIATION_PENDING",error:"Refund execution is recorded as PROCESSING; provider ledger confirmation is not yet available."},{status:202,headers:{"cache-control":"no-store"}});
    const ledgerJson = await ledgerResponse.json().catch(()=>null);
    const ledger = refundLedger(ledgerJson);
    if (!ledger) return Response.json({ok:false,productionReady:false,code:"PAYFAST_RECONCILIATION_PENDING",error:"PayFast returned no transaction ledger. Refund remains PROCESSING."},{status:202,headers:{"cache-control":"no-store"}});
    const reconciledTotal = ledger.transactions.reduce((sum,transaction)=>{
      const type=String(transaction.type||"");
      if (!/refund/i.test(type)) return sum;
      const value=Number(String(transaction.amount??"").replace(",",".")); 
      return Number.isFinite(value)?sum+Math.abs(Math.round(value)):sum;
    },0);
    const evidenceJson = JSON.stringify(ledger.raw);
    if (reconciledTotal < expectedProviderRefundTotal) {
      return Response.json({ok:false,productionReady:false,code:"PAYFAST_RECONCILIATION_PENDING",error:"The provider ledger does not yet show the expected increase in refunded funds. Refund remains PROCESSING."},{status:202,headers:{"cache-control":"no-store"}});
    }
    const settlementKey = "payfast-refund-reconciled:"+refund.id;
    const settled = await reviewerFetch(auth.session,"/rest/v1/rpc/n10_record_payfast_refund_reconciliation",{
      method:"POST",headers:{"content-type":"application/json"},
      body:JSON.stringify({
        p_refund_id:refund.id,p_actor_auth_user_id:auth.session.userId,p_provider_payment_id:providerPaymentId,
        p_reconciled_total_minor:reconciledTotal,p_evidence_sha256:sha256Hex(evidenceJson),p_idempotency_key:settlementKey
      })
    });
    if (!settled.ok) return Response.json({ok:false,productionReady:false,code:"PAYFAST_RECONCILIATION_PENDING",error:"Provider ledger does not yet reconcile to the expected cumulative refund total. Refund remains PROCESSING."},{status:202,headers:{"cache-control":"no-store"}});
    const settlementRows = await settled.json() as Array<{refund_status?:string;order_status?:string;reused?:boolean}>;
    if (!Array.isArray(settlementRows)||settlementRows.length!==1||settlementRows[0].refund_status!=="COMPLETED") {
      return Response.json({ok:false,productionReady:false,code:"PAYFAST_RECONCILIATION_PENDING",error:"Refund remains PROCESSING until provider ledger reconciliation is conclusive."},{status:202,headers:{"cache-control":"no-store"}});
    }
    return Response.json({ok:true,productionReady:false,refundStatus:"COMPLETED",orderStatus:settlementRows[0].order_status,reused:settlementRows[0].reused===true},{headers:{"cache-control":"no-store"}});
  } catch {
    return fail(503,"PAYFAST_REFUND_UNAVAILABLE","PayFast refund processing is unavailable. If execution was claimed, do not resubmit; reconcile the provider ledger.");
  }
}
