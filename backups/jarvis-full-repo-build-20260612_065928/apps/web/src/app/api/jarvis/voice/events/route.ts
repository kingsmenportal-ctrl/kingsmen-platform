import { NextResponse } from "next/server";
import { events, readState } from "@/lib/jarvis/doctrine";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(){return NextResponse.json({ok:true,state:readState(),events:events(100)})}
