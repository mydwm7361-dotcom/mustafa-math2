import { NextRequest, NextResponse } from "next/server"
import { sessionsDB } from "@/lib/server-store"

export async function POST(req: NextRequest) {
  const { code, deviceId } = await req.json()
  if (!code || !deviceId) return NextResponse.json({ success: false, message: "بيانات ناقصة" }, { status: 400 })
  const result = sessionsDB.login(code, deviceId)
  return NextResponse.json(result)
}
