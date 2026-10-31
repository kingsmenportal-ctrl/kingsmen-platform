import { spawnSync } from "node:child_process";
const r=spawnSync(process.execPath,["scripts/institutions/build-dhet-private-register-evidence-migration.mjs","--self-test"],{encoding:"utf8"});
process.stdout.write(r.stdout??"");process.stderr.write(r.stderr??"");if(r.status!==0)process.exit(r.status??1);