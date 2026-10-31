"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getCandidateAccessToken } from "../../../lib/candidate-session";
import directorySeed from "../../../../../../manifests/institutions/seed/public-universities-and-tvet-2026-10-31.json";
import crossSector from "../../../../../../manifests/institutions/cross-sector-institution-source-extension.json";

type Institution = (typeof directorySeed.records)[number];
type SourceAnchor = (typeof crossSector.sources)[number] & { provider_key?: string };
type VerifiedProviderRoute = {
  provider_key: string; provider_name: string; provider_type: string; province: string | null;
  base_url: string | null; verification_status: string; public_safe: boolean;
  default_confidence_band: string; notes: string;
};
type DirectoryItem = {
  id: string;
  registryKey: string | null;
  name: string;
  kind: "INSTITUTION" | "OFFICIAL_SOURCE" | "VERIFIED_ROUTE";
  providerType: string;
  sectorKeys: string[];
  province: string | null;
  serviceCapabilities: string[];
  pathways: string[];
  sourceName: string;
  sourceUrl: string | null;
  providerWebsiteUrl: string | null;
  providerWebsiteStatus: string;
  evidenceText: string;
  supports: string[];
  doesNotProve: string[];
  verification: {
    identity: string;
    accreditation: string;
    availability: string;
    eligibility: string;
    intake: string;
    route: string;
    integration: string;
    partnership: string;
  };
};

const pathwayLabels: Record<string, string> = {
  HIGHER_EDUCATION: "Higher education",
  TVET: "TVET",
  SETA_LEARNERSHIPS: "SETA learnerships",
  INTERNSHIPS: "Internships",
  APPRENTICESHIPS: "Apprenticeships",
  EMPLOYMENT: "Employment"
};

const capabilityLabels: Record<string, string> = {
  HIGHER_EDUCATION: "Higher education",
  TVET: "TVET",
  SETA_LEARNERSHIPS: "SETA learnerships",
  INTERNSHIPS: "Internships",
  APPRENTICESHIPS: "Apprenticeships",
  EMPLOYMENT: "Employment",
  FUNDING: "Funding",
  ACCOMMODATION: "Accommodation",
  HEALTH_AND_CARE: "Health and care",
  SOCIAL_SUPPORT: "Social support",
  TRANSPORT: "Transport",
  LEGAL_SUPPORT: "Legal support",
  PUBLIC_SERVICE: "Public services",
  BUSINESS_REGISTRATION: "Business registration",
  FINANCIAL_SERVICES: "Financial services",
  TECHNOLOGY_INTEGRATION: "Technology integration",
  BASIC_EDUCATION: "Basic education",
  ENERGY_AND_UTILITIES: "Energy and utilities"
};

const capabilityBySource: Record<string, string[]> = {
  gcis_national_institution_directory: ["PUBLIC_SERVICE"],
  gcis_public_entities_and_soe_directory: ["PUBLIC_SERVICE", "EMPLOYMENT"],
  gcis_provincial_local_municipal_directory: ["PUBLIC_SERVICE", "EMPLOYMENT"],
  national_treasury_municipal_finance_data: ["PUBLIC_SERVICE", "FINANCIAL_SERVICES"],
  govza_national_departments: ["PUBLIC_SERVICE"],
  govza_local_government: ["PUBLIC_SERVICE"],
  dpsa_vacancies: ["EMPLOYMENT"],
  dbe_school_emis: ["BASIC_EDUCATION"],
  lurits_registered_school_masterlist: ["BASIC_EDUCATION"],
  cipc_company_registry: ["BUSINESS_REGISTRATION"],
  dhet_skills_seta_qcto_saqa: ["HIGHER_EDUCATION", "TVET", "SETA_LEARNERSHIPS", "APPRENTICESHIPS"],
  dhet_private_colleges_register_2026: ["TVET"],
  dhet_private_higher_education_register_2026: ["HIGHER_EDUCATION"],
  dhet_cet_colleges_directory: ["BASIC_EDUCATION"],
  dhet_registered_pset_masterlist: ["HIGHER_EDUCATION", "TVET", "SETA_LEARNERSHIPS"],
  dhet_pset_landscape_2026_27: ["HIGHER_EDUCATION", "TVET", "SETA_LEARNERSHIPS", "APPRENTICESHIPS"],
  nsfas_institution_directory: ["FUNDING", "HIGHER_EDUCATION", "TVET"],
  dhet_national_skills_fund: ["FUNDING"],
  funza_lushaka_bursary: ["FUNDING", "HIGHER_EDUCATION"],
  nsfas_official: ["FUNDING", "SOCIAL_SUPPORT"],
  nsfas_accommodation_directory: ["ACCOMMODATION", "FUNDING"],
  govza_bursary_funding_guide: ["FUNDING"],
  bursaries_africa_provider_index_leads: ["FUNDING"],
  gcis_soe_acsa_employer: ["EMPLOYMENT", "TRANSPORT"],
  gcis_soe_denel_employer: ["EMPLOYMENT"],
  gcis_soe_prasa_employer: ["EMPLOYMENT", "TRANSPORT"],
  gcis_soe_saa_employer: ["EMPLOYMENT", "TRANSPORT"],
  gcis_soe_sabc_employer: ["EMPLOYMENT"],
  gcis_soe_sanral_employer: ["EMPLOYMENT", "TRANSPORT"],
  gcis_soe_sapo_employer: ["EMPLOYMENT", "TRANSPORT"],
  gcis_soe_telkom_employer: ["EMPLOYMENT"],
  gcis_soe_transnet_employer: ["EMPLOYMENT", "TRANSPORT"],
  national_health_facility_master_list: ["HEALTH_AND_CARE"],
  health_department_directory: ["HEALTH_AND_CARE"],
  hpcsa_professional_register: ["HEALTH_AND_CARE"],
  sassa_official: ["SOCIAL_SUPPORT"],
  nyda_official: ["FUNDING", "SOCIAL_SUPPORT"],
  dsd_npo_register: ["SOCIAL_SUPPORT"],
  fsca_financial_registers: ["FINANCIAL_SERVICES"],
  sarbs_regulated_entities: ["FINANCIAL_SERVICES"],
  housing_human_settlements: ["ACCOMMODATION"],
  legal_aid_south_africa: ["LEGAL_SUPPORT"],
  govza_thusong_centres: ["PUBLIC_SERVICE"],
  transport_department: ["TRANSPORT"],
  eskom_official: ["ENERGY_AND_UTILITIES"],
  sars_official: ["PUBLIC_SERVICE"],
  job_portal_provider_authorized: ["EMPLOYMENT", "INTERNSHIPS", "APPRENTICESHIPS", "SETA_LEARNERSHIPS"],
  accommodation_provider_direct: ["ACCOMMODATION"],
  technology_vendor_contract: ["TECHNOLOGY_INTEGRATION"]
};

const pathwayBySource: Record<string, string[]> = {
  dhet_skills_seta_qcto_saqa: ["HIGHER_EDUCATION", "TVET", "SETA_LEARNERSHIPS", "APPRENTICESHIPS"],
  dpsa_vacancies: ["EMPLOYMENT"],
  dhet_private_colleges_register_2026: ["TVET"],
  dhet_private_higher_education_register_2026: ["HIGHER_EDUCATION"],
  dhet_registered_pset_masterlist: ["HIGHER_EDUCATION", "TVET", "SETA_LEARNERSHIPS"],
  dhet_pset_landscape_2026_27: ["HIGHER_EDUCATION", "TVET", "SETA_LEARNERSHIPS", "APPRENTICESHIPS"],
  nsfas_institution_directory: ["HIGHER_EDUCATION", "TVET"],
  dhet_national_skills_fund: ["HIGHER_EDUCATION", "TVET", "SETA_LEARNERSHIPS", "APPRENTICESHIPS"],
  funza_lushaka_bursary: ["HIGHER_EDUCATION"],
  nsfas_official: ["HIGHER_EDUCATION", "TVET"],
  nsfas_accommodation_directory: ["HIGHER_EDUCATION", "TVET"],
  gcis_soe_acsa_employer: ["EMPLOYMENT"],
  gcis_soe_denel_employer: ["EMPLOYMENT"],
  gcis_soe_prasa_employer: ["EMPLOYMENT"],
  gcis_soe_saa_employer: ["EMPLOYMENT"],
  gcis_soe_sabc_employer: ["EMPLOYMENT"],
  gcis_soe_sanral_employer: ["EMPLOYMENT"],
  gcis_soe_sapo_employer: ["EMPLOYMENT"],
  gcis_soe_telkom_employer: ["EMPLOYMENT"],
  gcis_soe_transnet_employer: ["EMPLOYMENT"],
  job_portal_provider_authorized: ["EMPLOYMENT", "INTERNSHIPS", "APPRENTICESHIPS", "SETA_LEARNERSHIPS"],
  eskom_official: ["EMPLOYMENT"],
  sars_official: ["EMPLOYMENT"]
};

const sectorsByVerifiedRoute: Record<string, string[]> = {
  cao_official: ["EDUCATION_AND_SKILLS"], labour_department_vacancies: ["PUBLIC_ADMINISTRATION"], nsfas_official: ["FUNDING_AND_SOCIAL_SUPPORT"]
};
const capabilitiesByVerifiedRoute: Record<string, string[]> = {
  cao_official: ["HIGHER_EDUCATION"], labour_department_vacancies: ["EMPLOYMENT"], nsfas_official: ["FUNDING"]
};
const pathwaysByVerifiedRoute: Record<string, string[]> = {
  cao_official: ["HIGHER_EDUCATION"], labour_department_vacancies: ["EMPLOYMENT"], nsfas_official: ["HIGHER_EDUCATION", "TVET"]
};
const pathways = Object.keys(pathwayLabels);
const capabilities = crossSector.service_capabilities as string[];
const sectors = crossSector.institution_classes as string[];

function label(value: string): string {
  return value.replaceAll("_", " ").toLocaleLowerCase().replace(/\b\w/g, letter => letter.toUpperCase());
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

const institutionItems: DirectoryItem[] = directorySeed.records.map((record: Institution) => {
  const isUniversity = record.provider_type === "PUBLIC_UNIVERSITY";
  const pathway = isUniversity ? "HIGHER_EDUCATION" : "TVET";
  return {
    id: record.institution_ref,
    registryKey: isUniversity
      ? "dhet_university_" + record.institution_ref.replace(/^university-/, "")
      : "dhet_tvet_" + record.institution_ref.replace(/^tvet-/, ""),
    name: record.canonical_name,
    kind: "INSTITUTION",
    providerType: record.provider_type,
    sectorKeys: ["EDUCATION_AND_SKILLS"],
    province: record.province,
    serviceCapabilities: [pathway],
    pathways: [pathway],
    sourceName: "Department of Higher Education and Training",
    sourceUrl: record.directory_source_url,
    providerWebsiteUrl: record.official_website_url,
    providerWebsiteStatus: record.official_website_status,
    evidenceText: "Listed in the DHET source snapshot. This is directory evidence only.",
    supports: ["Institution identity as published in the cited DHET directory"],
    doesNotProve: [
      "current legal standing or provider identity beyond the directory entry",
      "accreditation or delivery scope for a particular programme",
      "current service or programme availability",
      "candidate eligibility or an open intake",
      "a Kingsmen partnership, live integration, submission or provider outcome"
    ],
    verification: {
      identity: "DIRECTORY_EVIDENCE_ONLY",
      accreditation: record.accreditation_or_delivery_scope_status,
      availability: "NOT_VERIFIED",
      eligibility: record.eligibility_status,
      intake: record.intake_status,
      route: record.application_route_status,
      integration: record.integration_status,
      partnership: record.partnership_status
    }
  };
});

const sourceItems: DirectoryItem[] = crossSector.sources.map((source: SourceAnchor) => {
  const sourceClasses = source.classes as string[];
  const isSetaProvider = Boolean(source.provider_key?.startsWith("seta_"));
  const sourceCapabilities = isSetaProvider
    ? ["SETA_LEARNERSHIPS", "APPRENTICESHIPS", "FUNDING"]
    : capabilityBySource[source.source_id] ?? [];
  const sourcePathways = isSetaProvider
    ? ["SETA_LEARNERSHIPS", "APPRENTICESHIPS"]
    : source.source_id === "funza_lushaka_bursary"
      ? ["HIGHER_EDUCATION"]
      : source.source_id === "dhet_national_skills_fund"
        ? ["HIGHER_EDUCATION", "TVET", "SETA_LEARNERSHIPS", "APPRENTICESHIPS"]
        : pathwayBySource[source.source_id] ?? [];
  return {
    id: source.source_id,
    registryKey: source.provider_key ?? null,
    name: source.name,
    kind: "OFFICIAL_SOURCE",
    providerType: source.provider_key?.startsWith("seta_") ? "SETA_PROVIDER"
      : (source.provider_key === "funder_nsf" || source.provider_key === "funder_funza_lushaka" || source.provider_key === "nsfas_official") ? "FUNDING_PROVIDER"
      : source.provider_key?.startsWith("soe_") ? "EMPLOYER_PROVIDER"
      : source.provider_key === "nsfas_accommodation_portal" ? "ACCOMMODATION_PROVIDER"
      : "SOURCE_REGISTRY",
    sectorKeys: sourceClasses,
    province: null,
    serviceCapabilities: sourceCapabilities,
    pathways: sourcePathways,
    sourceName: source.authority,
    sourceUrl: source.url,
    providerWebsiteUrl: null,
    providerWebsiteStatus: "NOT_LISTED",
    evidenceText: source.url ? "Sector source anchor for discovery and verification. It is not an imported institution/provider record." : "Provider category placeholder. No authoritative source URL is configured yet; this is not a verified provider record.",
    supports: source.supports,
    doesNotProve: source.does_not_prove,
    verification: {
      identity: "SOURCE_ANCHOR_ONLY",
      accreditation: "NOT_PROVED_BY_SOURCE_ANCHOR",
      availability: "NOT_PROVED_BY_SOURCE_ANCHOR",
      eligibility: "NOT_PROVED_BY_SOURCE_ANCHOR",
      intake: "NOT_PROVED_BY_SOURCE_ANCHOR",
      route: "NOT_PROVED_BY_SOURCE_ANCHOR",
      integration: source.connector_state,
      partnership: "NOT_ESTABLISHED"
    }
  };
});

const allItems = [...institutionItems, ...sourceItems];

function VerificationGrid({ item }: { item: DirectoryItem }) {
  const rows = [
    ["Identity / legal status", item.verification.identity],
    ["Accreditation / delivery scope", item.verification.accreditation],
    ["Current service availability", item.verification.availability],
    ["Candidate eligibility", item.verification.eligibility],
    ["Open programme / intake", item.verification.intake],
    ["Application / service route", item.verification.route],
    ["Technical integration", item.verification.integration],
    ["Partnership", item.verification.partnership]
  ];
  return (
    <dl className="mt-4 grid gap-2 sm:grid-cols-2">
      {rows.map(([name, value]) => (
        <div key={name} className="rounded-xl bg-slate-950/70 p-3">
          <dt className="text-[11px] uppercase tracking-wider text-slate-500">{name}</dt>
          <dd className="mt-1 break-words text-xs font-semibold text-slate-200">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function CandidateInstitutionDirectoryPage() {
  const [verifiedRoutes, setVerifiedRoutes] = useState<VerifiedProviderRoute[]>([]);
  const [routeStatus, setRouteStatus] = useState<"LOADING" | "READY" | "SIGN_IN_REQUIRED" | "UNAVAILABLE">("LOADING");
  const [retryKey, setRetryKey] = useState(0);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("ALL");
  const [sector, setSector] = useState("ALL");
  const [location, setLocation] = useState("ALL");
  const [capability, setCapability] = useState("ALL");
  const [pathway, setPathway] = useState("ALL");

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const token = getCandidateAccessToken();
    if (!token) {
      setRouteStatus("SIGN_IN_REQUIRED");
      return () => { active = false; controller.abort(); };
    }
    async function loadVerifiedRoutes() {
      try {
        const response = await fetch("/api/candidate/institutions", {
          headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: controller.signal
        });
        const body = await response.json();
        if (!response.ok || body.ok !== true || !Array.isArray(body.records)) throw new Error("Verified directory records are unavailable.");
        if (active) { setVerifiedRoutes(body.records as VerifiedProviderRoute[]); setRouteStatus("READY"); }
      } catch {
        if (active && !controller.signal.aborted) setRouteStatus("UNAVAILABLE");
      }
    }
    void loadVerifiedRoutes();
    return () => { active = false; controller.abort(); };
  }, [retryKey]);

  const provinces = useMemo(() => unique(
    directorySeed.records.map(record => record.province).filter((value): value is string => Boolean(value))
  ).sort((a, b) => a.localeCompare(b)), []);

  const verifiedRouteItems = useMemo<DirectoryItem[]>(() => verifiedRoutes.map(route => ({
    id: route.provider_key, registryKey: route.provider_key, name: route.provider_name, kind: "VERIFIED_ROUTE", providerType: route.provider_type,
    sectorKeys: sectorsByVerifiedRoute[route.provider_key] ?? [], province: route.province,
    serviceCapabilities: capabilitiesByVerifiedRoute[route.provider_key] ?? [], pathways: pathwaysByVerifiedRoute[route.provider_key] ?? [],
    sourceName: "Kingsmen canonical source-authority register", sourceUrl: route.base_url,
    providerWebsiteUrl: null, providerWebsiteStatus: "NOT_LISTED",
    evidenceText: "Read from the existing provider register because the record is VERIFIED, public-safe and confidence A/B. This does not verify every programme or intake.",
    supports: [`Registry record is VERIFIED and public_safe=true (confidence ${route.default_confidence_band}).`, route.notes],
    doesNotProve: [
      "legal standing or accreditation for every service without an exact register check",
      "current programme, vacancy or service availability", "candidate-specific eligibility or an open intake",
      "a provider-authorized Kingsmen integration or partnership", "submission, provider receipt, admission, appointment or other outcome"
    ],
    verification: {
      identity: "SOURCE/ROUTE ENTRY VERIFIED; LEGAL STATUS NOT VERIFIED", accreditation: "NOT_VERIFIED_BY_THIS_PROVIDER_ROW",
      availability: "RECHECK_EACH_CURRENT_NOTICE_OR_SERVICE", eligibility: "UNKNOWN", intake: "NOT_PROVED_BY_PROVIDER_ROW",
      route: "OFFICIAL_SOURCE_URL_LISTED; ROUTE RULES REQUIRE RECHECK", integration: "NOT_CONNECTED", partnership: "NOT_ESTABLISHED"
    }
  })), [verifiedRoutes]);
  const searchableItems = useMemo(() => [...allItems, ...verifiedRouteItems], [verifiedRouteItems]);

  const visibleItems = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return searchableItems
      .filter(item => kind === "ALL" || item.kind === kind)
      .filter(item => sector === "ALL" || item.sectorKeys.includes(sector))
      .filter(item => location === "ALL"
        || (location === "NATIONAL_SOURCE" && item.kind !== "INSTITUTION" && !item.province)
        || (location === "LOCATION_NOT_RECORDED" && item.kind === "INSTITUTION" && !item.province)
        || item.province === location)
      .filter(item => capability === "ALL" || item.serviceCapabilities.includes(capability))
      .filter(item => pathway === "ALL" || item.pathways.includes(pathway))
      .filter(item => !needle || [
        item.name, item.providerType, item.province ?? "", item.sourceName,
        item.sectorKeys.join(" "), item.serviceCapabilities.join(" "),
        item.pathways.join(" "), item.supports.join(" "), item.doesNotProve.join(" ")
      ].join(" ").toLocaleLowerCase().includes(needle))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [query, kind, sector, location, capability, pathway, searchableItems]);

  const clearFilters = () => {
    setQuery("");
    setKind("ALL");
    setSector("ALL");
    setLocation("ALL");
    setCapability("ALL");
    setPathway("ALL");
  };

  return (
    <main className="min-h-screen bg-[#071426] px-4 py-8 text-[#f4f0e6] sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-amber-300/25 bg-[#0b1d33] p-6 sm:p-8">
          <nav aria-label="Candidate navigation" className="mb-6 flex flex-wrap gap-3 text-sm">
            <Link href="/candidate" className="text-amber-200 hover:text-amber-100">Candidate portal</Link>
            <Link href="/candidate/dashboard" className="text-amber-200 hover:text-amber-100">Dashboard</Link>
            <Link href="/candidate/applications" className="text-amber-200 hover:text-amber-100">My applications</Link>
          </nav>
          <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-amber-300">Kingsmen One · National directory</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">One national institution and services directory</h1>
          <p className="mt-4 max-w-4xl text-sm leading-6 text-slate-300 sm:text-base">
            Search institution records and authoritative sector source directories from one place. Filter by sector,
            province/location, service capability and any of Kingsmen's six core pathways. A pathway or service tag is
            a discovery aid, not proof that an intake or service is currently available.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/candidate/opportunity-matches" className="rounded-xl bg-amber-300 px-4 py-3 text-sm font-extrabold text-[#101b2a]">
              Browse verified open opportunities
            </Link>
            <Link href="/candidate/applications" className="rounded-xl border border-slate-600 px-4 py-3 text-sm font-bold text-white">
              Open my application workbench
            </Link>
          </div>
        </header>

        <section aria-label="Current directory coverage" className="grid gap-3 sm:grid-cols-3">
          <article className="rounded-2xl border border-slate-700 bg-[#0b1d33] p-5">
            <p className="text-xs font-extrabold uppercase tracking-wider text-amber-300">Source-listed institution records</p>
            <p className="mt-2 text-3xl font-black text-white">{institutionItems.length}</p>
            <p className="mt-1 text-sm text-slate-400">Current data batch: public universities and TVET colleges only.</p>
          </article>
          <article className="rounded-2xl border border-slate-700 bg-[#0b1d33] p-5">
            <p className="text-xs font-extrabold uppercase tracking-wider text-amber-300">Official sector source anchors</p>
            <p className="mt-2 text-3xl font-black text-white">{sourceItems.length}</p>
            <p className="mt-1 text-sm text-slate-400">Discovery directories and authorities; not imported provider profiles.</p>
          </article>
          <article className="rounded-2xl border border-slate-700 bg-[#0b1d33] p-5">
            <p className="text-xs font-extrabold uppercase tracking-wider text-amber-300">Core opportunity pathways</p>
            <p className="mt-2 text-3xl font-black text-white">6</p>
            <p className="mt-1 text-sm text-slate-400">Education, TVET, learnerships, internships, apprenticeships and employment.</p>
          </article>
        </section>

        <section role="status" aria-label="Live verified provider sources" className="rounded-2xl border border-slate-700 bg-[#0b1d33] p-5">
          <h2 className="font-bold text-white">Live verified provider/source records</h2>
          {routeStatus === "READY" && <p className="mt-2 text-sm text-slate-300">{verifiedRoutes.length} public-safe, high-confidence records returned by the authenticated, read-only Supabase route.</p>}
          {routeStatus === "LOADING" && <p className="mt-2 text-sm text-slate-400">Loading authorised directory records…</p>}
          {routeStatus === "SIGN_IN_REQUIRED" && <div className="mt-2 flex flex-wrap items-center gap-3"><p className="text-sm text-slate-400">Sign in to load current verified provider/source records. The source manifest and DHET seed remain available as discovery evidence.</p><Link href="/candidate/login" className="font-bold text-amber-200 underline">Sign in</Link><button type="button" onClick={() => setRetryKey(value => value + 1)} className="rounded-xl border border-slate-600 px-3 py-2 text-xs font-bold text-white">Reload after sign-in</button></div>}
          {routeStatus === "UNAVAILABLE" && <div className="mt-2 flex flex-wrap items-center gap-3"><p className="text-sm text-yellow-100">Live records could not be loaded. Unverified data will not be substituted.</p><button type="button" onClick={() => setRetryKey(value => value + 1)} className="rounded-xl border border-slate-600 px-3 py-2 text-xs font-bold text-white">Retry live directory</button></div>}
        </section>

        <section role="note" aria-label="Verification boundary" className="rounded-2xl border border-yellow-500/40 bg-yellow-950/30 p-5">
          <h2 className="font-bold text-yellow-100">Discovery is not verification</h2>
          <p className="mt-2 text-sm leading-6 text-yellow-50/90">
            Kingsmen keeps these claims separate: directory listing, legal identity, accreditation or programme-delivery
            scope, current service availability, candidate eligibility, open intake, application route, technical
            connection, partnership, submission receipt and provider-confirmed outcome. Unknown or stale claims stay
            unverified and must not be presented as available to candidates.
          </p>
        </section>

        <section aria-label="Directory filters" className="rounded-2xl border border-slate-700 bg-[#0b1d33] p-5 sm:p-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="block text-sm font-bold text-white">
              Search names, sectors, services or source evidence
              <input
                type="search"
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Institution, authority, service or pathway"
                className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-950 px-3 py-3 font-normal text-white placeholder:text-slate-500 focus:border-amber-300 focus:outline-none"
              />
            </label>
            <label className="block text-sm font-bold text-white">
              Result type
              <select value={kind} onChange={event => setKind(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-950 px-3 py-3 font-normal text-white">
                <option value="ALL">Institutions and official source directories</option>
                <option value="INSTITUTION">Source-listed institution records</option>
                <option value="VERIFIED_ROUTE">Verified provider/source route records</option>
                <option value="OFFICIAL_SOURCE">Official sector source directories</option>
              </select>
            </label>
            <label className="block text-sm font-bold text-white">
              Institution sector
              <select value={sector} onChange={event => setSector(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-950 px-3 py-3 font-normal text-white">
                <option value="ALL">All sectors</option>
                {sectors.map(value => <option value={value} key={value}>{label(value)}</option>)}
              </select>
            </label>
            <label className="block text-sm font-bold text-white">
              Province / location
              <select value={location} onChange={event => setLocation(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-950 px-3 py-3 font-normal text-white">
                <option value="ALL">All locations</option>
                <option value="NATIONAL_SOURCE">National source directories</option>
                <option value="LOCATION_NOT_RECORDED">Institution location not recorded</option>
                {provinces.map(value => <option value={value} key={value}>{value}</option>)}
              </select>
            </label>
            <label className="block text-sm font-bold text-white">
              Service capability
              <select value={capability} onChange={event => setCapability(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-950 px-3 py-3 font-normal text-white">
                <option value="ALL">All service categories</option>
                {capabilities.map(value => <option value={value} key={value}>{capabilityLabels[value] ?? label(value)}</option>)}
              </select>
            </label>
            <label className="block text-sm font-bold text-white">
              Kingsmen pathway
              <select value={pathway} onChange={event => setPathway(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-950 px-3 py-3 font-normal text-white">
                <option value="ALL">All six pathways</option>
                {pathways.map(value => <option value={value} key={value}>{pathwayLabels[value]}</option>)}
              </select>
            </label>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p aria-live="polite" className="text-sm text-slate-400">
              Showing <span className="font-bold text-white">{visibleItems.length}</span> of {searchableItems.length} current searchable entries.
            </p>
            <button type="button" onClick={clearFilters} className="rounded-xl border border-slate-600 px-4 py-2 text-sm font-bold text-white hover:border-amber-300">
              Clear filters
            </button>
          </div>
        </section>

        <section aria-label="Directory results" className="grid gap-4 xl:grid-cols-2">
          {visibleItems.map(item => (
            <article key={item.id} className="flex h-full flex-col rounded-2xl border border-slate-700 bg-[#0b1d33] p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
                    {item.kind === "INSTITUTION" ? label(item.providerType) : item.kind === "VERIFIED_ROUTE" ? "Kingsmen verified source/provider route" : item.sourceUrl ? "Official sector source / registry" : "Provider category — source not verified"}
                  </p>
                  <h2 className="mt-2 text-xl font-bold text-white">{item.name}</h2>
                  <p className="mt-2 text-xs text-slate-400">
                    {item.province ?? (item.kind === "OFFICIAL_SOURCE" ? "National or provider-specific source" : "Location not recorded")}
                    {" · "}Source: {item.sourceName}
                  </p>
                </div>
                <span className="rounded-full border border-slate-600 px-3 py-1 text-xs font-bold text-slate-300">
                  {item.kind === "INSTITUTION" ? "Directory evidence only" : item.kind === "VERIFIED_ROUTE" ? "Verified source record" : "Discovery source only"}
                </span>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-300">{item.evidenceText}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {item.sectorKeys.map(value => <span key={value} className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-200">{label(value)}</span>)}
              </div>
              <div className="mt-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Service discovery categories</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.serviceCapabilities.length
                    ? item.serviceCapabilities.map(value => <span key={value} className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">{capabilityLabels[value] ?? label(value)}</span>)
                    : <span className="text-xs text-slate-500">No service category mapped for this source.</span>}
                </div>
              </div>
              <div className="mt-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pathway source relevance — not an open opportunity</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.pathways.length
                    ? item.pathways.map(value => <span key={value} className="rounded-full border border-amber-300/30 px-3 py-1 text-xs text-amber-100">{pathwayLabels[value] ?? label(value)}</span>)
                    : <span className="text-xs text-slate-500">No core-pathway mapping established.</span>}
                </div>
              </div>

              <VerificationGrid item={item} />

              <details className="mt-4 rounded-xl border border-slate-700 bg-slate-950/50 p-3">
                <summary className="cursor-pointer text-sm font-bold text-slate-200">Evidence scope and limitations</summary>
                <div className="mt-3 space-y-3 text-xs leading-5 text-slate-400">
                  <div>
                    <p className="font-bold text-slate-300">What the source supports</p>
                    <ul className="mt-1 list-disc space-y-1 pl-5">{item.supports.map(value => <li key={value}>{value}</li>)}</ul>
                  </div>
                  <div>
                    <p className="font-bold text-slate-300">What it does not prove</p>
                    <ul className="mt-1 list-disc space-y-1 pl-5">{item.doesNotProve.map(value => <li key={value}>{value}</li>)}</ul>
                  </div>
                </div>
              </details>

              <div className="mt-auto flex flex-wrap items-center gap-3 pt-5">
                {item.sourceUrl && item.sourceUrl.startsWith("https://") ? (
                  <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex rounded-xl border border-amber-300/40 px-4 py-3 text-sm font-bold text-amber-100 hover:border-amber-300">
                    Open source website ↗
                  </a>
                ) : (
                  <span className="rounded-xl border border-yellow-500/30 bg-yellow-950/20 px-4 py-3 text-xs font-semibold text-yellow-100">
                    Authoritative provider-specific source link still requires verification.
                  </span>
                )}
                {item.kind === "INSTITUTION" && item.providerWebsiteUrl && item.providerWebsiteUrl.startsWith("https://") && (
                  <div className="flex flex-col gap-1">
                    <a href={item.providerWebsiteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex rounded-xl border border-amber-300/40 px-4 py-3 text-sm font-bold text-amber-100 hover:border-amber-300">
                      Open institution website listed by DHET ↗
                    </a>
                    <span className="text-[11px] text-slate-500">DHET-listed website; current live destination has not been reverified.</span>
                  </div>
                )}
                {item.kind === "INSTITUTION" && !item.providerWebsiteUrl && (
                  <span className="rounded-xl border border-yellow-500/30 bg-yellow-950/20 px-4 py-3 text-xs font-semibold text-yellow-100">
                    Institution website URL unresolved. Kingsmen will not guess the URL.
                  </span>
                )}
                {item.registryKey && (item.kind !== "OFFICIAL_SOURCE" || item.providerType === "SETA_PROVIDER" || item.providerType === "FUNDING_PROVIDER" || item.providerType === "EMPLOYER_PROVIDER" || item.providerType === "ACCOMMODATION_PROVIDER") && (
                  <Link
                    href={`/candidate/applications?directory_provider_key=${encodeURIComponent(item.registryKey)}&directory_provider_name=${encodeURIComponent(item.name)}&directory_pathway=${encodeURIComponent(item.pathways.find(value => pathways.includes(value)) ?? (item.providerType === "TVET" ? "TVET" : "HIGHER_EDUCATION"))}`}
                    className="inline-flex rounded-xl bg-amber-300 px-4 py-3 text-sm font-extrabold text-[#101b2a] hover:bg-amber-200"
                  >
                    Prepare with Kingsmen
                  </Link>
                )}
                <Link href="/candidate/applications" className="inline-flex rounded-xl border border-slate-600 px-4 py-3 text-sm font-bold text-white hover:border-amber-300">
                  Open Kingsmen workbench
                </Link>
              </div>
              <p className="mt-3 text-[11px] leading-5 text-slate-500">
                The workbench can prepare a destination-specific request where a verified route exists. This directory does not submit to the institution, confirm a receipt or record a provider outcome.
              </p>
            </article>
          ))}
        </section>

        {visibleItems.length === 0 && (
          <div className="rounded-2xl border border-slate-700 bg-[#0b1d33] p-8 text-center">
            <h2 className="text-lg font-bold text-white">No results match those filters</h2>
            <p className="mt-2 text-sm text-slate-400">Try another sector, location, service capability or pathway.</p>
            <button type="button" onClick={clearFilters} className="mt-4 rounded-xl bg-amber-300 px-4 py-3 text-sm font-extrabold text-[#101b2a]">
              Clear filters
            </button>
          </div>
        )}

        <section aria-label="National coverage still to import" className="rounded-2xl border border-slate-700 bg-[#0b1d33] p-5 sm:p-6">
          <h2 className="text-xl font-bold text-white">Coverage still to import and verify</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            The institution-record dataset remains limited to 26 public universities and 50 TVET colleges. The cross-sector
            entries above are official discovery anchors, not 24 additional verified providers. Private higher education,
            private colleges, CET colleges, individual employers, health facilities, accommodation operators, local service
            organisations and other provider records must be sourced and verified in separate controlled batches.
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            For currently verified opportunities, use <Link href="/candidate/opportunity-matches" className="font-bold text-amber-200 underline">verified opportunity discovery</Link>.
            Kingsmen only presents an opportunity as open when its source and intake evidence pass the relevant verification checks.
          </p>
        </section>

        <footer className="border-t border-slate-700 pt-5 text-xs leading-5 text-slate-500">
          This directory combines the DHET public-university/TVET source snapshot dated {directorySeed.researched_at}, cross-sector
          discovery anchors dated {crossSector.researched_at}, and authenticated public-safe registry rows where available. These record types have different evidence scopes.
          The authenticated Kingsmen profile, private documents and saved application records remain in the candidate workbench.
        </footer>
      </div>
    </main>
  );
}
