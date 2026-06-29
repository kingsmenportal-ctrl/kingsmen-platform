'use client';

const rows = [
  ['01', 'Command Received', 'command_intake'],
  ['02', 'General Question Answering', 'general_answer'],
  ['03', 'Anything Current', 'current_fact_verification'],
  ['04', 'Opening Dates or Deadlines', 'deadline_verification'],
  ['05', 'Weather', 'weather'],
  ['06', 'News', 'news'],
  ['07', 'Jobs', 'jobs'],
  ['08', 'Business', 'business_strategy'],
  ['09', 'Technology', 'technology_analysis'],
  ['10', 'Coding', 'coding'],
  ['11', 'AI or Agents', 'ai_agent_governance'],
  ['12', 'OpenClaw', 'openclaw_gateway'],
  ['13', 'Playwright', 'playwright_scout'],
  ['14', 'n8n', 'n8n_worker'],
  ['15', 'Airtable', 'airtable_mirror'],
  ['16', 'PostgreSQL', 'postgresql_truth_vault']
] as const;

export function JarvisV5ScriptLibraryPanel() {
  return (
    <section aria-label="Jarvis V5 Script Library Panel" data-jarvis-panel="v5-script-library-01-to-16">
      <header>
        <p>JARVIS V5 SCRIPT LIBRARY</p>
        <h2>Numbers 01–16 — Runtime Registry Built</h2>
      </header>

      <dl>
        <div>
          <dt>Doctrine files</dt>
          <dd>Created in GitHub</dd>
        </div>
        <div>
          <dt>Runtime registry</dt>
          <dd>Built in repo</dd>
        </div>
        <div>
          <dt>API route</dt>
          <dd>Built in repo</dd>
        </div>
        <div>
          <dt>Validator</dt>
          <dd>Built in repo</dd>
        </div>
        <div>
          <dt>Live runtime</dt>
          <dd>Not proven until deployed and executed</dd>
        </div>
      </dl>

      <table>
        <thead>
          <tr>
            <th>Number</th>
            <th>Script</th>
            <th>Command family</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([number, title, commandFamily]) => (
            <tr key={number} data-jarvis-script-number={number}>
              <td>{number}</td>
              <td>{title}</td>
              <td>{commandFamily}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p>
        Commander, this panel shows repo-built coverage for the first sixteen Jarvis V5 script-library
        behaviours. It must not claim live production success until runtime checks, validators, and deployment
        evidence are captured.
      </p>
    </section>
  );
}

export default JarvisV5ScriptLibraryPanel;
