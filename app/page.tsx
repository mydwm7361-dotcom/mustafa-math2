"use client"

import { useEffect, useState } from "react"
import LoginPage from "@/components/LoginPage"
import StudentDashboard from "@/components/StudentDashboard"
import AdminDashboard from "@/components/AdminDashboard"
import MathBackground from "@/components/MathBackground"
import { adminService, sessionsService, getDeviceId } from "@/lib/api"
import type { Student } from "@/lib/types"

type View = "login" | "student" | "admin"

export default function Home() {
  const [view, setView] = useState<View>("login")
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Restore admin session (localStorage)
    if (adminService.isLoggedIn()) {
      setView("admin")
      return
    }
    // Restore student session from sessionStorage
    const savedCode = sessionStorage.getItem("mk_session_code")
    if (savedCode) {
      const deviceId = getDeviceId()
      sessionsService.login(savedCode, deviceId).then(result => {
        if (result.success && result.student) {
          setCurrentStudent(result.student)
          setView("student")
        } else {
          sessionStorage.removeItem("mk_session_code")
        }
      })
    }
  }, [])

  function handleStudentLogin(student: Student) {
    sessionStorage.setItem("mk_session_code", student.code)
    setCurrentStudent(student)
    setView("student")
  }

  function handleAdminLogin() {
    setView("admin")
  }

  async function handleLogout() {
    if (view === "student" && currentStudent) {
      await sessionsService.logout(currentStudent.code, getDeviceId())
      sessionStorage.removeItem("mk_session_code")
      setCurrentStudent(null)
    }
    if (view === "admin") {
      adminService.logout()
    }
    setView("login")
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#07101e" }}>
        <div className="w-12 h-12 rounded-full border-4 animate-spin"
          style={{ borderColor: "#1e3a5f", borderTopColor: "#2563eb" }} />
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: "#07101e" }}>
      <MathBackground />
      {view === "login" && (
        <LoginPage onStudentLogin={handleStudentLogin} onAdminLogin={handleAdminLogin} />
      )}
      {view === "student" && currentStudent && (
        <StudentDashboard student={currentStudent} onLogout={handleLogout} />
      )}
      {view === "admin" && (
        <AdminDashboard onLogout={handleLogout} />
      )}
    </div>
  )
}
