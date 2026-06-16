import { NextResponse } from "next/server";
import { buildReply } from "@/lib/jarvis/doctrine";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function POST(request:Request){const b=await request.json().catch(()=>({}));return NextResponse.json({ok:true,...buildReply(String(b?.text??b?.command??""),String(b?.source??"command-api"))})}
