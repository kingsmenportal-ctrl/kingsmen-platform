import { NextResponse } from "next/server";
import { status, event } from "@/lib/jarvis/doctrine";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(){event("status-check",{source:"api"});return NextResponse.json(status())}
