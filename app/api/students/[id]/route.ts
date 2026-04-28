import { NextRequest, NextResponse } from "next/server"
import { studentsDB } from "@/lib/server-store"
import { generateCode } from "@/lib/types"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  // Support renewing code
  if (body.renewCode) {
    const code = generateCode()
    const student = studentsDB.update(id, { code, isSuspended: false, activeSessions: [] })
    return NextResponse.json(student)
  }
  const student = studentsDB.update(id, body)
  return NextResponse.json(student)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  studentsDB.delete(id)
  return NextResponse.json({ ok: true })
}
