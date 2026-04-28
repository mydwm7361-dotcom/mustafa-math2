// Client-side API calls — talks to the server (shared across ALL devices)

import type { Student, ClassRoom, Video, VideoProgress } from "./types"
export type { Student, ClassRoom, Video, VideoProgress }

// Generate/get a stable device ID stored in localStorage
export function getDeviceId(): string {
  if (typeof window === "undefined") return ""
  let id = localStorage.getItem("mk_device_id")
  if (!id) {
    id = "dev_" + Math.random().toString(36).substr(2, 16) + "_" + Date.now()
    localStorage.setItem("mk_device_id", id)
  }
  return id
}

const ADMIN_KEY = "mk_admin_session"

// ─── Admin (client-side only, no need for server) ─────────────────────────────
export const adminService = {
  login: (password: string): boolean => {
    if (password === "mustafa2024@admin") {
      localStorage.setItem(ADMIN_KEY, "true")
      return true
    }
    return false
  },
  isLoggedIn: (): boolean => {
    if (typeof window === "undefined") return false
    return localStorage.getItem(ADMIN_KEY) === "true"
  },
  logout: (): void => {
    localStorage.removeItem(ADMIN_KEY)
  },
}

// ─── Students ─────────────────────────────────────────────────────────────────
export const studentsService = {
  getAll: async (): Promise<Student[]> => {
    const res = await fetch("/api/students")
    return res.json()
  },
  create: async (name: string, classId: string, className: string): Promise<Student> => {
    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, classId, className }),
    })
    return res.json()
  },
  update: async (id: string, updates: Partial<Student & { renewCode?: boolean }>): Promise<Student> => {
    const res = await fetch(`/api/students/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    })
    return res.json()
  },
  delete: async (id: string): Promise<void> => {
    await fetch(`/api/students/${id}`, { method: "DELETE" })
  },
}

// ─── Sessions ─────────────────────────────────────────────────────────────────
export const sessionsService = {
  login: async (code: string, deviceId: string): Promise<{ success: boolean; message: string; student?: Student }> => {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.toUpperCase().trim(), deviceId }),
    })
    return res.json()
  },
  logout: async (code: string, deviceId: string): Promise<void> => {
    await fetch("/api/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, deviceId }),
    })
  },
}

// ─── Classes ──────────────────────────────────────────────────────────────────
export const classesService = {
  getAll: async (): Promise<ClassRoom[]> => {
    const res = await fetch("/api/classes")
    return res.json()
  },
  create: async (name: string, grade: string): Promise<ClassRoom> => {
    const res = await fetch("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, grade }),
    })
    return res.json()
  },
  delete: async (id: string): Promise<void> => {
    await fetch(`/api/classes/${id}`, { method: "DELETE" })
  },
}

// ─── Videos ───────────────────────────────────────────────────────────────────
export const videosService = {
  getAll: async (): Promise<Video[]> => {
    const res = await fetch("/api/videos")
    return res.json()
  },
  create: async (data: { title: string; description: string; driveUrl: string; classId: string; className: string; duration?: string }): Promise<Video> => {
    const res = await fetch("/api/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    return res.json()
  },
  delete: async (id: string): Promise<void> => {
    await fetch(`/api/videos/${id}`, { method: "DELETE" })
  },
}

// ─── Progress ─────────────────────────────────────────────────────────────────
export const progressService = {
  getByStudent: async (studentId: string): Promise<VideoProgress[]> => {
    const res = await fetch(`/api/progress?studentId=${studentId}`)
    return res.json()
  },
  get: async (videoId: string, studentId: string): Promise<VideoProgress | null> => {
    const res = await fetch(`/api/progress?videoId=${videoId}&studentId=${studentId}`)
    return res.json()
  },
  update: async (videoId: string, studentId: string, progress: number): Promise<void> => {
    await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId, studentId, progress }),
    })
  },
}
