import { NextRequest, NextResponse } from "next/server"
import { classesDB } from "@/lib/server-store"

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  classesDB.delete(id)
  return NextResponse.json({ ok: true })
}
