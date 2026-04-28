import { NextRequest, NextResponse } from "next/server"
import { classesDB } from "@/lib/server-store"

export async function GET() {
  return NextResponse.json(classesDB.getAll())
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, grade } = body
  if (!name) return NextResponse.json({ error: "missing name" }, { status: 400 })
  const cls = classesDB.create({ name, grade: grade || "" })
  return NextResponse.json(cls)
}
