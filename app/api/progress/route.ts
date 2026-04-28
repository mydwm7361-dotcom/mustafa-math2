import { NextRequest, NextResponse } from "next/server"
import { progressDB } from "@/lib/server-store"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get("studentId")
  const videoId = searchParams.get("videoId")
  if (studentId && videoId) {
    return NextResponse.json(progressDB.get(videoId, studentId))
  }
  if (studentId) {
    return NextResponse.json(progressDB.getByStudent(studentId))
  }
  return NextResponse.json([])
}

export async function POST(req: NextRequest) {
  const { videoId, studentId, progress } = await req.json()
  if (!videoId || !studentId || progress === undefined) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 })
  }
  progressDB.update(videoId, studentId, progress)
  return NextResponse.json({ ok: true })
}
