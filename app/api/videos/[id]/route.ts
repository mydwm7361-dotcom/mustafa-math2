import { NextRequest, NextResponse } from "next/server"
import { videosDB } from "@/lib/server-store"

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  videosDB.delete(id)
  return NextResponse.json({ ok: true })
}
