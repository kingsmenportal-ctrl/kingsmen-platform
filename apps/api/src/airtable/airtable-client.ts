import { getAirtableBaseDefinition } from "./airtable-base-registry";
import type { AirtableBaseKey } from "./airtable-types";

export interface AirtableRecord {
  id?: string;
  fields: Record<string, unknown>;
}

export interface AirtableClientOptions {
  apiKey?: string;
  baseIdByKey?: Partial<Record<AirtableBaseKey, string>>;
  fetchImpl?: typeof fetch;
}

export class AirtableClient {
  private readonly apiKey?: string;
  private readonly baseIdByKey: Partial<Record<AirtableBaseKey, string>>;
  private readonly fetchImpl: typeof fetch;

  constructor(options: AirtableClientOptions = {}) {
    this.apiKey = options.apiKey ?? process.env.AIRTABLE_API_KEY;
    this.baseIdByKey = options.baseIdByKey ?? {};
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  private getBaseId(baseKey: AirtableBaseKey): string {
    const baseDefinition = getAirtableBaseDefinition(baseKey);
    const explicit = this.baseIdByKey[baseKey];
    const fromEnv = process.env[baseDefinition.envVar];
    const baseId = explicit ?? fromEnv;
    if (!baseId) {
      throw new Error(`Missing Airtable base ID for ${baseKey}. Set ${baseDefinition.envVar}.`);
    }
    return baseId;
  }

  private requireApiKey(): string {
    if (!this.apiKey) {
      throw new Error("Missing AIRTABLE_API_KEY. Secrets must be supplied by runtime environment, not committed.");
    }
    return this.apiKey;
  }

  async upsertMirrorRecord(baseKey: AirtableBaseKey, tableName: string, record: AirtableRecord): Promise<AirtableRecord> {
    const baseId = this.getBaseId(baseKey);
    const apiKey = this.requireApiKey();
    const encodedTable = encodeURIComponent(tableName);

    if (record.id) {
      const response = await this.fetchImpl(`https://api.airtable.com/v0/${baseId}/${encodedTable}/${record.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ fields: record.fields })
      });

      if (!response.ok) {
        throw new Error(`Airtable PATCH failed: ${response.status} ${response.statusText}`);
      }

      return (await response.json()) as AirtableRecord;
    }

    const response = await this.fetchImpl(`https://api.airtable.com/v0/${baseId}/${encodedTable}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ records: [{ fields: record.fields }] })
    });

    if (!response.ok) {
      throw new Error(`Airtable POST failed: ${response.status} ${response.statusText}`);
    }

    const json = (await response.json()) as { records: AirtableRecord[] };
    return json.records[0];
  }
}