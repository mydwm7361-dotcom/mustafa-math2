// Server-side store — persisted via globalThis across hot-reloads
// All data lives on the server, accessible from any device

import { Student, ClassRoom, Video, VideoProgress } from "./types"

export type { Student, ClassRoom, Video, VideoProgress }

type DB = {
  students: Student[]
  classes: ClassRoom[]
  videos: Video[]
  progress: VideoProgress[]
  sessions: { code: string; deviceId: string; loginAt: string }[]
  initialized: boolean
}

declare global {
  // eslint-disable-next-line no-var
  var __mk_db: DB | undefined
}

function getDB(): DB {
  if (!globalThis.__mk_db) {
    globalThis.__mk_db = {
      students: [],
      classes: [],
      videos: [],
      progress: [],
      sessions: [],
      initialized: false,
    }
  }
  return globalThis.__mk_db
}

function init() {
  const db = getDB()
  if (db.initialized) return
  db.initialized = true
  // Seed default classes
  db.classes = [
    { id: "c1", name: "الصف الأول متوسط",    grade: "1", createdAt: new Date().toISOString() },
    { id: "c2", name: "الصف الثاني متوسط",   grade: "2", createdAt: new Date().toISOString() },
    { id: "c3", name: "الصف الثالث متوسط",   grade: "3", createdAt: new Date().toISOString() },
    { id: "c4", name: "الصف الأول إعدادي",   grade: "4", createdAt: new Date().toISOString() },
    { id: "c5", name: "الصف الثاني إعدادي",  grade: "5", createdAt: new Date().toISOString() },
    { id: "c6", name: "الصف الثالث إعدادي",  grade: "6", createdAt: new Date().toISOString() },
  ]
}

// ─── Students ─────────────────────────────────────────────────────────────────
export const studentsDB = {
  getAll: (): Student[] => { init(); return getDB().students },

  getByCode: (code: string): Student | null => {
    init()
    return getDB().students.find(s => s.code === code.toUpperCase().trim()) || null
  },

  create: (data: Omit<Student, "id" | "createdAt" | "activeSessions" | "isSuspended">): Student => {
    init()
    const db = getDB()
    const student: Student = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      activeSessions: [],
      isSuspended: false,
    }
    db.students.push(student)
    return student
  },

  update: (id: string, updates: Partial<Student>): Student | null => {
    init()
    const db = getDB()
    const idx = db.students.findIndex(s => s.id === id)
    if (idx === -1) return null
    db.students[idx] = { ...db.students[idx], ...updates }
    return db.students[idx]
  },

  delete: (id: string): void => {
    init()
    const db = getDB()
    db.students = db.students.filter(s => s.id !== id)
  },
}

// ─── Sessions ─────────────────────────────────────────────────────────────────
export const sessionsDB = {
  login: (code: string, deviceId: string): { success: boolean; message: string; student?: Student } => {
    init()
    const db = getDB()
    const student = studentsDB.getByCode(code)
    if (!student) return { success: false, message: "الكود غير صحيح، تحقق من الكود وأعد المحاولة" }
    if (!student.isActive) return { success: false, message: "هذا الكود معطل، تواصل مع الأستاذ" }

    if (student.isSuspended) {
      if (student.suspendedUntil && new Date() < new Date(student.suspendedUntil)) {
        const remaining = Math.ceil((new Date(student.suspendedUntil).getTime() - Date.now()) / 60000)
        return { success: false, message: `الكود معلق مؤقتاً (دخول من جهازين). انتظر ${remaining} دقيقة أو تواصل مع الأستاذ` }
      }
      studentsDB.update(student.id, { isSuspended: false, suspendedUntil: undefined, activeSessions: [] })
      db.sessions = db.sessions.filter(s => s.code !== code)
    }

    const now = Date.now()
    db.sessions = db.sessions.filter(s => now - new Date(s.loginAt).getTime() < 24 * 60 * 60 * 1000)

    const activeForCode = db.sessions.filter(s => s.code === code)
    const thisDevice = activeForCode.find(s => s.deviceId === deviceId)

    if (!thisDevice && activeForCode.length > 0) {
      studentsDB.update(student.id, {
        isSuspended: true,
        suspendedUntil: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        activeSessions: [],
      })
      db.sessions = db.sessions.filter(s => s.code !== code)
      return { success: false, message: "تم اكتشاف دخول من جهاز آخر! الكود معلق 15 دقيقة. لا تشارك كودك مع أحد" }
    }

    db.sessions = db.sessions.filter(s => !(s.code === code && s.deviceId === deviceId))
    db.sessions.push({ code, deviceId, loginAt: new Date().toISOString() })

    const fresh = studentsDB.getByCode(code)!
    return { success: true, message: "تم الدخول بنجاح", student: fresh }
  },

  logout: (code: string, deviceId: string): void => {
    const db = getDB()
    db.sessions = db.sessions.filter(s => !(s.code === code && s.deviceId === deviceId))
  },
}

// ─── Classes ──────────────────────────────────────────────────────────────────
export const classesDB = {
  getAll: (): ClassRoom[] => { init(); return getDB().classes },

  create: (data: Omit<ClassRoom, "id" | "createdAt">): ClassRoom => {
    init()
    const db = getDB()
    const cls: ClassRoom = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
    db.classes.push(cls)
    return cls
  },

  delete: (id: string): void => {
    init()
    const db = getDB()
    db.classes = db.classes.filter(c => c.id !== id)
  },
}

// ─── Videos ───────────────────────────────────────────────────────────────────
export const videosDB = {
  getAll: (): Video[] => { init(); return getDB().videos },

  getByClass: (classId: string): Video[] => { init(); return getDB().videos.filter(v => v.classId === classId) },

  create: (data: Omit<Video, "id" | "uploadedAt">): Video => {
    init()
    const db = getDB()
    const video: Video = { ...data, id: crypto.randomUUID(), uploadedAt: new Date().toISOString() }
    db.videos.push(video)
    return video
  },

  delete: (id: string): void => {
    init()
    const db = getDB()
    db.videos = db.videos.filter(v => v.id !== id)
  },
}

// ─── Progress ─────────────────────────────────────────────────────────────────
export const progressDB = {
  get: (videoId: string, studentId: string): VideoProgress | null => {
    init()
    return getDB().progress.find(p => p.videoId === videoId && p.studentId === studentId) || null
  },

  update: (videoId: string, studentId: string, progress: number): void => {
    init()
    const db = getDB()
    const idx = db.progress.findIndex(p => p.videoId === videoId && p.studentId === studentId)
    const entry: VideoProgress = { videoId, studentId, progress, lastWatched: new Date().toISOString() }
    if (idx === -1) db.progress.push(entry)
    else db.progress[idx] = entry
  },

  getByStudent: (studentId: string): VideoProgress[] => {
    init()
    return getDB().progress.filter(p => p.studentId === studentId)
  },
}
