import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type JarvisAction = {
  id: string;
  title: string;
  description: string;
};

const SYSTEM_PROMPT = `You are Kingsmen Jarvis, the voice-first operating companion for the Kingsmen platform.
Speak like a calm, capable executive operator to the founder.
You are not a generic chatbot and you are not a proof dashboard.
Help the founder reason, plan, inspect, research, and decide what Kingsmen should do next.
Respect Kingsmen doctrine: Email is primary, WhatsApp urgent only, SMS backup, Playwright scout only, PostgreSQL Truth Vault authority, Airtable mirror only, n8n thin relay only, no fake production readiness, no raw secrets, and no unsafe execution without founder approval.
When asked to run a system task, suggest the matching backend-safe Kingsmen action rather than pretending it ran.
Keep responses useful, direct, and structured for spoken conversation.`;

const ACTIONS: JarvisAction[] = [
  { id: "SYSTEM_VALIDATE_N20", title: "Validate Kingsmen system lock", description: "Checks the N20 system lock and current source-safe build posture." },
  { id: "COMMAND_PERSISTENCE_PROOF", title: "Check Truth Vault evidence", description: "Runs a backend command envelope proof for command_log and audit_events evidence." },
  { id: "AI_PROVIDER_ROUTER_CHECK", title: "Inspect AI provider router", description: "Reviews backend-controlled AI provider readiness without exposing keys." },
  { id: "EMAIL_PRIMARY_CHANNEL_CHECK", title: "Inspect email channel", description: "Checks email-first communication boundary and evidence rules." },
  { id: "PAYFAST_STAGING_EVIDENCE", title: "Review PayFast staging evidence", description: "Checks PayFast sandbox, ITN, failed-payment and duplicate-ITN evidence posture." },
  { id: "N8N_THIN_RELAY_CHECK", title: "Inspect n8n relay", description: "Confirms n8n remains a relay and not authority." },
  { id: "GITHUB_TOOL_CONNECTOR_CHECK", title: "Inspect GitHub connector", description: "Reviews connector metadata and repo boundary evidence." },
  { id: "EVIDENCE_BUNDLE_REVIEW", title: "Review final evidence bundle", description: "Reviews the final launch evidence bundle and remaining blockers." }
];

function selectActions(message: string): JarvisAction[] {
  const value = message.toLowerCase();
  const picks = ACTIONS.filter((action) => {
    const haystack = `${action.id} ${action.title} ${action.description}`.toLowerCase();
    return value.split(/\s+/).some((word) => word.length > 4 && haystack.includes(word));
  });
  return (picks.length ? picks : ACTIONS.slice(0, 4)).slice(0, 4);
}

function extractOutputText(payload: any): string {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) return payload.output_text.trim();
  const output = Array.isArray(payload?.output) ? payload.output : [];
  for (const item of output) {
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const part of content) {
      if (typeof part?.text === "string" && part.text.trim()) return part.text.trim();
    }
  }
  return "Sir, I processed the request, but the AI provider returned no spoken text.";
}

function cleanEnvValue(value: string): string {
  return value.trim().replace(/^['\"]|['\"]$/g, "");
}

function readEnvValueFromFile(filePath: string, key: string): string | null {
  try {
    const text = readFileSync(filePath, "utf8");
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const index = line.indexOf("=");
      if (index === -1) continue;
      const name = line.slice(0, index).trim();
      if (name !== key) continue;
      const value = cleanEnvValue(line.slice(index + 1));
      return value || null;
    }
  } catch {
    return null;
  }
  return null;
}

function getServerEnv(key: string): string | undefined {
  const direct = process.env[key]?.trim();
  if (direct) return direct;

  const candidates = [
    resolve(process.cwd(), ".env.local"),
    resolve(process.cwd(), "..", "..", ".env.local"),
    resolve(process.cwd(), "apps", "web", ".env.local")
  ];

  for (const candidate of candidates) {
    const value = readEnvValueFromFile(candidate, key);
    if (value) {
      process.env[key] = value;
      return value;
    }
  }

  return undefined;
}

export async function POST(request: NextRequest) {
  const startedAt = new Date();
  const body = await request.json().catch(() => ({}));
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!message) {
    return NextResponse.json(
      {
        ok: false,
        reply: "Sir, I did not hear a request. Say Jarvis, then tell me what you need.",
        actions: ACTIONS.slice(0, 3),
        generatedAt: new Date().toISOString(),
        localShellExecuted: false,
        directDatabaseAccessFromWeb: false,
        rawSecretsReturned: false
      },
      { status: 400 }
    );
  }

  const apiKey = getServerEnv("OPENAI_API_KEY");
  const model = getServerEnv("OPENAI_MODEL") || "gpt-4o-mini";
  const actions = selectActions(message);

  if (!apiKey || !apiKey.startsWith("sk-")) {
    return NextResponse.json(
      {
        ok: false,
        reply: "Sir, I am listening, but my live AI brain key is not available to the Jarvis server process yet. Save a replacement OPENAI_API_KEY in apps/web/.env.local, restart Jarvis web, and I will answer with the backend AI brain.",
        actions,
        providerConfigured: false,
        generatedAt: new Date().toISOString(),
        durationMs: Date.now() - startedAt.getTime(),
        localShellExecuted: false,
        directDatabaseAccessFromWeb: false,
        rawSecretsReturned: false
      },
      { status: 503 }
    );
  }

  try {
    const aiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        instructions: SYSTEM_PROMPT,
        input: message,
        temperature: 0.45,
        max_output_tokens: 900
      })
    });

    const payload = await aiResponse.json().catch(() => ({}));

    if (!aiResponse.ok) {
      return NextResponse.json(
        {
          ok: false,
          reply: "Sir, the Jarvis AI provider rejected the request. The key, model, quota, or provider policy needs attention. I will not fake the answer.",
          actions,
          providerConfigured: true,
          providerStatus: aiResponse.status,
          generatedAt: new Date().toISOString(),
          durationMs: Date.now() - startedAt.getTime(),
          localShellExecuted: false,
          directDatabaseAccessFromWeb: false,
          rawSecretsReturned: false
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      reply: extractOutputText(payload),
      actions,
      providerConfigured: true,
      providerStatus: aiResponse.status,
      generatedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt.getTime(),
      localShellExecuted: false,
      directDatabaseAccessFromWeb: false,
      rawSecretsReturned: false
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        reply: "Sir, I could not reach the Jarvis AI provider from the backend. Check network access and provider configuration. I will not fabricate a response.",
        actions,
        providerConfigured: true,
        generatedAt: new Date().toISOString(),
        durationMs: Date.now() - startedAt.getTime(),
        localShellExecuted: false,
        directDatabaseAccessFromWeb: false,
        rawSecretsReturned: false
      },
      { status: 502 }
    );
  }
}
