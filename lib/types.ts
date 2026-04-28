export interface Student {
  id: string
  name: string
  code: string
  classId: string
  className: string
  createdAt: string
  isActive: boolean
  activeSessions: string[]
  isSuspended: boolean
  suspendedUntil?: string
}

export interface ClassRoom {
  id: string
  name: string
  grade: string
  createdAt: string
}

export interface Video {
  id: string
  title: string
  description: string
  driveUrl: string
  classId: string
  className: string
  uploadedAt: string
  duration?: string
  thumbnail?: string
}

export interface VideoProgress {
  videoId: string
  studentId: string
  progress: number
  lastWatched: string
}

export function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}
