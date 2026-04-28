import { NextRequest, NextResponse } from "next/server"
import { studentsDB } from "@/lib/server-store"
import { generateCode } from "@/lib/types"

export async function GET() {
  return NextResponse.json(studentsDB.getAll())
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, classId, className } = body
  if (!name || !classId) return NextResponse.json({ error: "missing fields" }, { status: 400 })
  const code = generateCode()
  const student = studentsDB.create({ name, classId, className, code, isActive: true })
  return NextResponse.json(student)
}
