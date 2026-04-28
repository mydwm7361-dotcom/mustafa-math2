export interface Student {
  id: string
  name: string
  code: string
  classId: string
  className: string
  createdAt: string
  isActive: boolean
  activeSessions: string[] // device session IDs
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
  progress: number // 0-100
  lastWatched: string
}

export interface Session {
  code: string
  deviceId: string
  loginAt: string
}

const STUDENTS_KEY = "mk_students"
const CLASSES_KEY = "mk_classes"
const VIDEOS_KEY = "mk_videos"
const PROGRESS_KEY = "mk_progress"
const SESSIONS_KEY = "mk_sessions"
const ADMIN_SESSION_KEY = "mk_admin_session"

// Generate unique device ID
export function getDeviceId(): string {
  if (typeof window === "undefined") return ""
  let id = localStorage.getItem("mk_device_id")
  if (!id) {
    id = "dev_" + Math.random().toString(36).substr(2, 16) + "_" + Date.now()
    localStorage.setItem("mk_device_id", id)
  }
  return id
}

// Generate random code (6 chars)
export function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

// Students
export const studentsService = {
  getAll: (): Student[] => {
    if (typeof window === "undefined") return []
    try {
      return JSON.parse(localStorage.getItem(STUDENTS_KEY) || "[]")
    } catch { return [] }
  },
  getByCode: (code: string): Student | null => {
    const all = studentsService.getAll()
    return all.find(s => s.code === code.toUpperCase()) || null
  },
  create: (data: Omit<Student, "id" | "createdAt" | "activeSessions" | "isSuspended">): Student => {
    const all = studentsService.getAll()
    const student: Student = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      activeSessions: [],
      isSuspended: false,
    }
    all.push(student)
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(all))
    return student
  },
  update: (id: string, updates: Partial<Student>): Student | null => {
    const all = studentsService.getAll()
    const idx = all.findIndex(s => s.id === id)
    if (idx === -1) return null
    all[idx] = { ...all[idx], ...updates }
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(all))
    return all[idx]
  },
  delete: (id: string): void => {
    const all = studentsService.getAll().filter(s => s.id !== id)
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(all))
  },
}

// Sessions management
export const sessionsService = {
  getAll: (): Session[] => {
    if (typeof window === "undefined") return []
    try {
      return JSON.parse(localStorage.getItem(SESSIONS_KEY) || "[]")
    } catch { return [] }
  },
  // Login with code - check if another device is already active
  login: (code: string, deviceId: string): { success: boolean; message: string; student?: Student } => {
    const student = studentsService.getByCode(code)
    if (!student) return { success: false, message: "الكود غير صحيح، تحقق من الكود وأعد المحاولة" }
    if (!student.isActive) return { success: false, message: "هذا الكود غير مفعل، تواصل مع الأستاذ" }

    // Check if suspended
    if (student.isSuspended) {
      if (student.suspendedUntil && new Date() < new Date(student.suspendedUntil)) {
        return { success: false, message: "تم تعليق هذا الكود مؤقتاً بسبب الدخول من أجهزة متعددة. انتظر قليلاً أو تواصل مع الأستاذ" }
      } else {
        // Unsuspend
        studentsService.update(student.id, { isSuspended: false, suspendedUntil: undefined, activeSessions: [] })
      }
    }

    // Get fresh student data after potential unsuspend
    const freshStudent = studentsService.getByCode(code)!
    
    // Check active sessions - if another device is active for this code
    const sessions = sessionsService.getAll()
    const activeSessions = sessions.filter(s => s.code === code)
    
    // Remove old sessions (older than 24 hours)
    const now = Date.now()
    const validSessions = activeSessions.filter(s => now - new Date(s.loginAt).getTime() < 24 * 60 * 60 * 1000)
    
    // Check if this device is already one of the active sessions
    const thisDeviceSession = validSessions.find(s => s.deviceId === deviceId)
    
    if (!thisDeviceSession && validSessions.length > 0) {
      // Another device is using this code - SUSPEND
      studentsService.update(student.id, {
        isSuspended: true,
        suspendedUntil: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 min suspension
      })
      // Remove all sessions for this code
      const allSessions = sessionsService.getAll().filter(s => s.code !== code)
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(allSessions))
      return {
        success: false,
        message: "تم اكتشاف دخول من جهاز آخر! تم تعليق الكود مؤقتاً لمدة 15 دقيقة. لا تشارك كودك مع أحد"
      }
    }

    // Create or refresh session
    const allSessions = sessionsService.getAll().filter(s => !(s.code === code && s.deviceId === deviceId))
    allSessions.push({ code, deviceId, loginAt: new Date().toISOString() })
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(allSessions))

    return { success: true, message: "تم الدخول بنجاح", student: freshStudent }
  },
  logout: (code: string, deviceId: string): void => {
    const all = sessionsService.getAll().filter(s => !(s.code === code && s.deviceId === deviceId))
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(all))
  }
}

// Classes
export const classesService = {
  getAll: (): ClassRoom[] => {
    if (typeof window === "undefined") return []
    try {
      const data = JSON.parse(localStorage.getItem(CLASSES_KEY) || "null")
      if (!data) {
        // Default classes
        const defaults: ClassRoom[] = [
          { id: "c1", name: "الصف الأول", grade: "1", createdAt: new Date().toISOString() },
          { id: "c2", name: "الصف الثاني", grade: "2", createdAt: new Date().toISOString() },
          { id: "c3", name: "الصف الثالث", grade: "3", createdAt: new Date().toISOString() },
          { id: "c4", name: "الصف الرابع", grade: "4", createdAt: new Date().toISOString() },
          { id: "c5", name: "الصف الخامس", grade: "5", createdAt: new Date().toISOString() },
          { id: "c6", name: "الصف السادس", grade: "6", createdAt: new Date().toISOString() },
        ]
        localStorage.setItem(CLASSES_KEY, JSON.stringify(defaults))
        return defaults
      }
      return data
    } catch { return [] }
  },
  create: (data: Omit<ClassRoom, "id" | "createdAt">): ClassRoom => {
    const all = classesService.getAll()
    const cls: ClassRoom = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
    all.push(cls)
    localStorage.setItem(CLASSES_KEY, JSON.stringify(all))
    return cls
  },
  delete: (id: string): void => {
    const all = classesService.getAll().filter(c => c.id !== id)
    localStorage.setItem(CLASSES_KEY, JSON.stringify(all))
  },
}

// Videos
export const videosService = {
  getAll: (): Video[] => {
    if (typeof window === "undefined") return []
    try { return JSON.parse(localStorage.getItem(VIDEOS_KEY) || "[]") } catch { return [] }
  },
  getByClass: (classId: string): Video[] => {
    return videosService.getAll().filter(v => v.classId === classId)
  },
  create: (data: Omit<Video, "id" | "uploadedAt">): Video => {
    const all = videosService.getAll()
    const video: Video = { ...data, id: crypto.randomUUID(), uploadedAt: new Date().toISOString() }
    all.push(video)
    localStorage.setItem(VIDEOS_KEY, JSON.stringify(all))
    return video
  },
  delete: (id: string): void => {
    const all = videosService.getAll().filter(v => v.id !== id)
    localStorage.setItem(VIDEOS_KEY, JSON.stringify(all))
  },
}

// Progress tracking
export const progressService = {
  get: (videoId: string, studentId: string): VideoProgress | null => {
    if (typeof window === "undefined") return null
    try {
      const all: VideoProgress[] = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "[]")
      return all.find(p => p.videoId === videoId && p.studentId === studentId) || null
    } catch { return null }
  },
  update: (videoId: string, studentId: string, progress: number): void => {
    if (typeof window === "undefined") return
    try {
      const all: VideoProgress[] = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "[]")
      const idx = all.findIndex(p => p.videoId === videoId && p.studentId === studentId)
      const entry: VideoProgress = { videoId, studentId, progress, lastWatched: new Date().toISOString() }
      if (idx === -1) all.push(entry)
      else all[idx] = entry
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(all))
    } catch {}
  },
  getStudentAll: (studentId: string): VideoProgress[] => {
    if (typeof window === "undefined") return []
    try {
      const all: VideoProgress[] = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "[]")
      return all.filter(p => p.studentId === studentId)
    } catch { return [] }
  }
}

// Admin session
export const adminService = {
  login: (password: string): boolean => {
    if (password === "mustafa2024@admin") {
      localStorage.setItem(ADMIN_SESSION_KEY, "true")
      return true
    }
    return false
  },
  isLoggedIn: (): boolean => {
    if (typeof window === "undefined") return false
    return localStorage.getItem(ADMIN_SESSION_KEY) === "true"
  },
  logout: (): void => {
    localStorage.removeItem(ADMIN_SESSION_KEY)
  }
}
