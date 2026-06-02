import fs from "node:fs/promises";
import path from "node:path";
import type { StoredFreeDestinyMapIntakeSummary } from "../../../../packages/contracts/src/free-destiny-map-persistence";

export interface FreeDestinyMapLocalRepositoryOptions {
  baseDirectory?: string;
}

export class FreeDestinyMapLocalRepository {
  private readonly baseDirectory: string;

  constructor(options: FreeDestinyMapLocalRepositoryOptions = {}) {
    this.baseDirectory = options.baseDirectory ?? path.join(process.cwd(), "data", "local", "free-destiny-map");
  }

  async appendIntake(summary: StoredFreeDestinyMapIntakeSummary): Promise<{ path: string; written: true }> {
    await fs.mkdir(this.baseDirectory, { recursive: true });

    const filePath = path.join(this.baseDirectory, "intakes.jsonl");
    const line = `${JSON.stringify(summary)}\n`;

    await fs.appendFile(filePath, line, "utf8");

    return {
      path: filePath,
      written: true
    };
  }
}
