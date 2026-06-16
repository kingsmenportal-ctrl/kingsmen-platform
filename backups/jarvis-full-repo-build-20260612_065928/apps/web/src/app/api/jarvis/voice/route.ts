import { NextResponse } from "next/server";
import { buildReply, event } from "@/lib/jarvis/doctrine";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function POST(request:Request){const b=await request.json().catch(()=>({}));const text=String(b?.text??"");event("voice-heard",{text,confidence:b?.confidence??null,source:String(b?.source??"native-voice-bridge")});return NextResponse.json({ok:true,heard:text,confidence:b?.confidence??null,...buildReply(text,String(b?.source??"native-voice-bridge"))})}
