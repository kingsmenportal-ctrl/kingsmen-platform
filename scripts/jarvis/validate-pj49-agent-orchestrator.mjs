#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
const root = process.cwd();
function j(p){return JSON.parse(readFileSync(path.join(root,p),'utf8'))}
let ok=true;
const v=j('manifests/jarvis/pj49-agent-orchestrator-validation.json');
for(const f of v.required_files||[]){if(!existsSync(path.join(root,f))){console.error('missing '+f);ok=false}}
const r=j('manifests/jarvis/jarvis-agent-role-catalog.json');
const ids=new Set((r.roles||[]).map(x=>x.role_id));
const flow=j('manifests/jarvis/jarvis-orchestration-flow.json');
for(const s of flow.steps||[]){if(!ids.has(s.role_id)){console.error('bad role '+s.role_id);ok=false}}
const policy=j('manifests/jarvis/jarvis-orchestration-policy.json');
if(policy.global_rules?.unknown_role_default!=='blocked') ok=false;
if(policy.global_rules?.one_request_one_plan!==true) ok=false;
if(!existsSync(path.join(root,'apps/web/src/lib/jarvis/runtime/orchestrator/index.ts'))) ok=false;
if(!ok) process.exit(1);
console.log('PJ49 VALIDATION PASSED');
console.log('roles '+ids.size);
console.log('steps '+(flow.steps||[]).length);
