import { NextRequest, NextResponse } from "next/server"
import { videosDB } from "@/lib/server-store"

export async function GET() {
  return NextResponse.json(videosDB.getAll())
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { title, description, driveUrl, classId, className, duration } = body
  if (!title || !driveUrl || !classId) return NextResponse.json({ error: "missing fields" }, { status: 400 })
  const video = videosDB.create({ title, description: description || "", driveUrl, classId, className: className || "", duration })
  return NextResponse.json(video)
}
