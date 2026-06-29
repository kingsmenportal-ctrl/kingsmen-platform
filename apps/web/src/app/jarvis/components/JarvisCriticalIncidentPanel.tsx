'use client';

export type JarvisCriticalIncidentPanelProps = {
  readonly incidentLevel?: 'critical' | 'critical_unproven' | 'blocked';
  readonly affectedArea?: string;
  readonly confirmedImpact?: string;
  readonly unconfirmedMatters?: string;
  readonly riskExposure?: string;
  readonly containmentAction?: string;
  readonly owner?: string;
  readonly recommendedCommand?: string;
  readonly evidenceRef?: string | null;
  readonly runtimeProof?: string | null;
};

export function JarvisCriticalIncidentPanel(props: JarvisCriticalIncidentPanelProps) {
  const rows = [
    ['Incident level', props.incidentLevel ?? 'critical_unproven'],
    ['Affected area', props.affectedArea ?? 'not_named'],
    ['Confirmed impact', props.confirmedImpact ?? 'not_confirmed'],
    ['Unconfirmed matters', props.unconfirmedMatters ?? 'not_listed'],
    ['Risk exposure', props.riskExposure ?? 'not_stated'],
    ['Containment required', props.containmentAction ?? 'not_set'],
    ['Owner', props.owner ?? 'unassigned'],
    ['Recommended command', props.recommendedCommand ?? 'not_set'],
    ['Evidence reference', props.evidenceRef ?? 'not_captured'],
    ['Runtime proof', props.runtimeProof ?? 'Runtime proof not captured yet.']
  ] as const;

  return (
    <section aria-label="Jarvis Critical Incident Panel" data-jarvis-panel="critical-incident">
      <header>
        <p>CRITICAL INCIDENT</p>
        <h2>Containment — Confirmed Impact — Recommended Command</h2>
      </header>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label} data-jarvis-incident-row={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p>
        Commander, this panel must not classify a matter as critical without evidence. Confirmed impact,
        unconfirmed matters, risk exposure, containment, owner, recommended command, and proof state must remain visible.
      </p>
    </section>
  );
}

export default JarvisCriticalIncidentPanel;
