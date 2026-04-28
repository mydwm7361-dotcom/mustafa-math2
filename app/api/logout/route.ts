import { NextRequest, NextResponse } from "next/server"
import { sessionsDB } from "@/lib/server-store"

export async function POST(req: NextRequest) {
  const { code, deviceId } = await req.json()
  if (code && deviceId) sessionsDB.logout(code, deviceId)
  return NextResponse.json({ ok: true })
}
