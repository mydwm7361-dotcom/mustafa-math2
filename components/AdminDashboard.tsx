"use client"

import { useState, useEffect } from "react"
import { studentsService, classesService, videosService, adminService } from "@/lib/api"
import type { Student, ClassRoom, Video } from "@/lib/types"

interface AdminDashboardProps { onLogout: () => void }
type Tab = "students" | "classes" | "videos" | "codes"

const INP: React.CSSProperties = {
  width: "100%", padding: "10px 14px",
  background: "rgba(255,255,255,0.04)", border: "2px solid #1c2f50",
  borderRadius: 12, color: "#e8edf8", outline: "none",
  fontFamily: "Cairo, sans-serif", fontSize: 14, transition: "border-color 0.2s",
}
const BTN_GOLD: React.CSSProperties = {
  background: "linear-gradient(135deg,#d97706,#f59e0b)", color: "#07101e",
  border: "none", borderRadius: 12, padding: "10px 20px",
  fontWeight: 800, cursor: "pointer", fontFamily: "Cairo, sans-serif", fontSize: 14,
}
const BTN_GHOST: React.CSSProperties = {
  background: "transparent", color: "#6b82a0",
  border: "1px solid #1c2f50", borderRadius: 12, padding: "10px 20px",
  fontWeight: 700, cursor: "pointer", fontFamily: "Cairo, sans-serif", fontSize: 14,
}
const BTN_DANGER: React.CSSProperties = {
  background: "rgba(239,68,68,0.12)", color: "#f87171",
  border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "6px 12px",
  fontWeight: 700, cursor: "pointer", fontFamily: "Cairo, sans-serif", fontSize: 13,
}
const CARD: React.CSSProperties = {
  background: "#0d1a2e", border: "1px solid #1c2f50",
  borderRadius: 16, padding: "16px 18px", marginBottom: 10,
  display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [tab, setTab] = useState<Tab>("students")
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<ClassRoom[]>([])
  const [videos, setVideos] = useState<Video[]>([])
  const [filterClass, setFilterClass] = useState("")
  const [search, setSearch] = useState("")

  // Student form
  const [newName, setNewName] = useState("")
  const [newClass, setNewClass] = useState("")
  const [lastCode, setLastCode] = useState("")

  // Video form
  const [vTitle, setVTitle] = useState("")
  const [vDesc, setVDesc] = useState("")
  const [vUrl, setVUrl] = useState("")
  const [vClass, setVClass] = useState("")
  const [vDuration, setVDuration] = useState("")

  // Class form
  const [cName, setCName] = useState("")
  const [cGrade, setCGrade] = useState("")

  const [showAddStudent, setShowAddStudent] = useState(false)
  const [showAddVideo, setShowAddVideo] = useState(false)
  const [showAddClass, setShowAddClass] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [copied, setCopied] = useState("")

  const reload = async () => {
    const [s, c, v] = await Promise.all([
      studentsService.getAll(),
      classesService.getAll(),
      videosService.getAll(),
    ])
    setStudents(s)
    setClasses(c)
    setVideos(v)
  }

  useEffect(() => { reload() }, [])

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(""), 2000)
  }

  const handleAddStudent = async () => {
    if (!newName.trim() || !newClass) return
    const cls = classes.find(c => c.id === newClass)
    const student = await studentsService.create(newName.trim(), newClass, cls?.name || "")
    setLastCode(student.code)
    setNewName(""); setNewClass("")
    setShowAddStudent(false)
    await reload()
    showToast(`تم الإنشاء — الكود: ${student.code}`)
  }

  const handleAddVideo = async () => {
    if (!vTitle.trim() || !vUrl.trim() || !vClass) return
    const cls = classes.find(c => c.id === vClass)
    let url = vUrl.trim()
    const m = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
    if (m) url = `https://drive.google.com/file/d/${m[1]}/preview`
    await videosService.create({ title: vTitle.trim(), description: vDesc.trim(), driveUrl: url, classId: vClass, className: cls?.name || "", duration: vDuration.trim() || undefined })
    setVTitle(""); setVDesc(""); setVUrl(""); setVClass(""); setVDuration("")
    setShowAddVideo(false)
    await reload()
    showToast("تم رفع الفيديو")
  }

  const handleAddClass = async () => {
    if (!cName.trim()) return
    await classesService.create(cName.trim(), cGrade.trim())
    setCName(""); setCGrade("")
    setShowAddClass(false)
    await reload()
    showToast("تم إضافة الفصل")
  }

  const unsuspend = async (id: string) => {
    await studentsService.update(id, { isSuspended: false, suspendedUntil: undefined, activeSessions: [] })
    await reload()
    showToast("تم رفع التعليق")
  }

  const filteredStudents = students
    .filter(s => !filterClass || s.classId === filterClass)
    .filter(s => !search || s.name.includes(search) || s.code.includes(search.toUpperCase()))
  const filteredVideos = filterClass ? videos.filter(v => v.classId === filterClass) : videos
  const suspendedCount = students.filter(s => s.isSuspended).length

  const TABS: { id: Tab; label: string; badge?: number }[] = [
    { id: "students", label: "الطلاب" },
    { id: "classes", label: "الفصول" },
    { id: "videos", label: "الفيديوهات" },
    { id: "codes", label: "الأكواد", badge: suspendedCount },
  ]

  return (
    <div className="min-h-screen text-foreground" dir="rtl" style={{ background: "#07101e" }}>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b px-4 py-3 flex items-center justify-between"
        style={{ background: "rgba(7,16,30,0.95)", backdropFilter: "blur(14px)", borderColor: "#1c2f50" }}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm"
            style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)", color: "#fff", boxShadow: "0 0 20px rgba(37,99,235,0.4)" }}>
            م.ك
          </div>
          <div>
            <div className="font-black text-sm" style={{ color: "#e8edf8" }}>لوحة تحكم أ. مصطفى كريم</div>
            <div className="text-xs" style={{ color: "#6b82a0" }}>إدارة المنصة التعليمية</div>
          </div>
        </div>
        <button onClick={() => { adminService.logout(); onLogout() }}
          className="text-xs font-bold px-3 py-1.5 rounded-lg"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}>
          خروج
        </button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 max-w-5xl mx-auto">
        {[
          { label: "إجمالي الطلاب", val: students.length, color: "#93c5fd", bg: "rgba(37,99,235,0.1)", icon: "◉" },
          { label: "الفصول", val: classes.length, color: "#86efac", bg: "rgba(16,185,129,0.1)", icon: "▦" },
          { label: "الفيديوهات", val: videos.length, color: "#fbbf24", bg: "rgba(245,158,11,0.1)", icon: "▶" },
          { label: "أكواد معلقة", val: suspendedCount, color: "#f87171", bg: "rgba(239,68,68,0.1)", icon: "⚠" },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl p-5 flex items-center gap-3"
            style={{ background: "#0d1a2e", border: `1px solid ${s.bg.replace("0.1", "0.3")}` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
              style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div>
              <div className="text-2xl font-black" style={{ color: s.color }}>{s.val}</div>
              <div className="text-xs" style={{ color: "#6b82a0" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="px-4 max-w-5xl mx-auto">
        <div className="flex gap-2 p-1 rounded-xl mb-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #1c2f50" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all duration-200 relative"
              style={tab === t.id
                ? { background: "#2563eb", color: "#fff", boxShadow: "0 4px 14px rgba(37,99,235,0.4)" }
                : { color: "#6b82a0" }}>
              {t.label}
              {t.badge ? (
                <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full text-xs flex items-center justify-center font-black"
                  style={{ background: "#ef4444", color: "#fff" }}>{t.badge}</span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Filter row */}
        {(tab === "students" || tab === "videos") && (
          <div className="flex gap-3 mb-4 flex-wrap">
            <select value={filterClass} onChange={e => setFilterClass(e.target.value)} style={{ ...INP, maxWidth: 200 }}>
              <option value="">جميع الفصول</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {tab === "students" && (
              <input style={{ ...INP, flex: 1, minWidth: 150 }} placeholder="بحث بالاسم أو الكود..."
                value={search} onChange={e => setSearch(e.target.value)} />
            )}
          </div>
        )}

        <div className="pb-20">

          {/* ── Students ── */}
          {tab === "students" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-black" style={{ color: "#e8edf8" }}>الطلاب ({filteredStudents.length})</h2>
                <button style={BTN_GOLD} onClick={() => setShowAddStudent(true)}>+ طالب جديد</button>
              </div>

              {lastCode && (
                <div className="rounded-2xl p-4 mb-4 flex items-center justify-between gap-3"
                  style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.3)" }}>
                  <div>
                    <div className="text-xs font-bold" style={{ color: "#34d399" }}>آخر كود تم إنشاؤه</div>
                    <div className="font-mono font-black text-xl mt-0.5" style={{ color: "#34d399", letterSpacing: "0.2em" }}>{lastCode}</div>
                  </div>
                  <button onClick={() => copyCode(lastCode)} className="text-xs px-3 py-1.5 rounded-lg font-bold"
                    style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "#34d399" }}>
                    {copied === lastCode ? "تم النسخ" : "نسخ"}
                  </button>
                </div>
              )}

              {filteredStudents.length === 0 && (
                <div className="text-center py-12 rounded-2xl" style={{ background: "#0d1a2e", border: "1px solid #1c2f50" }}>
                  <div className="font-bold" style={{ color: "#6b82a0" }}>لا يوجد طلاب</div>
                </div>
              )}

              {filteredStudents.map(s => (
                <div key={s.id} style={CARD}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                    style={{ background: "rgba(37,99,235,0.15)", color: "#93c5fd" }}>{s.name[0]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate" style={{ color: "#e8edf8" }}>{s.name}</div>
                    <div className="text-xs" style={{ color: "#6b82a0" }}>{s.className}</div>
                  </div>
                  <button onClick={() => copyCode(s.code)}
                    className="font-mono font-black text-base px-3 py-1.5 rounded-lg flex-shrink-0 transition-all hover:scale-105"
                    style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.25)", color: "#93c5fd", letterSpacing: "0.2em" }}
                    title="انقر لنسخ الكود">
                    {copied === s.code ? "✓" : s.code}
                  </button>
                  <div className="flex items-center gap-2 flex-wrap">
                    {s.isSuspended
                      ? <span className="text-xs px-2 py-1 rounded-lg font-bold" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>معلق</span>
                      : s.isActive
                      ? <span className="text-xs px-2 py-1 rounded-lg font-bold" style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", color: "#34d399" }}>نشط</span>
                      : <span className="text-xs px-2 py-1 rounded-lg font-bold" style={{ background: "rgba(107,114,128,0.15)", color: "#6b82a0" }}>معطل</span>
                    }
                    {s.isSuspended && (
                      <button style={{ ...BTN_GHOST, padding: "4px 10px", fontSize: 12 }} onClick={() => unsuspend(s.id)}>رفع التعليق</button>
                    )}
                    <button style={{ ...BTN_DANGER, background: s.isActive ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)", color: s.isActive ? "#f87171" : "#34d399", borderColor: s.isActive ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)" }}
                      onClick={async () => { await studentsService.update(s.id, { isActive: !s.isActive }); reload() }}>
                      {s.isActive ? "تعطيل" : "تفعيل"}
                    </button>
                    <button style={BTN_DANGER}
                      onClick={async () => { if (confirm("حذف الطالب نهائياً؟")) { await studentsService.delete(s.id); reload() } }}>
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Classes ── */}
          {tab === "classes" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-black" style={{ color: "#e8edf8" }}>الفصول ({classes.length})</h2>
                <button style={BTN_GOLD} onClick={() => setShowAddClass(true)}>+ فصل جديد</button>
              </div>
              <div className="grid gap-3">
                {classes.map(c => (
                  <div key={c.id} className="rounded-2xl p-5 flex items-center gap-4"
                    style={{ background: "#0d1a2e", border: "1px solid #1c2f50" }}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black flex-shrink-0"
                      style={{ background: "rgba(37,99,235,0.15)", color: "#93c5fd" }}>{c.grade || "◉"}</div>
                    <div className="flex-1">
                      <div className="font-black" style={{ color: "#e8edf8" }}>{c.name}</div>
                      <div className="flex gap-3 mt-1">
                        <span className="text-xs font-bold" style={{ color: "#93c5fd" }}>{students.filter(s => s.classId === c.id).length} طالب</span>
                        <span className="text-xs font-bold" style={{ color: "#fbbf24" }}>{videos.filter(v => v.classId === c.id).length} فيديو</span>
                      </div>
                    </div>
                    <button style={BTN_DANGER}
                      onClick={async () => { if (confirm("حذف الفصل؟")) { await classesService.delete(c.id); reload() } }}>حذف</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Videos ── */}
          {tab === "videos" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-black" style={{ color: "#e8edf8" }}>الفيديوهات ({filteredVideos.length})</h2>
                <button style={BTN_GOLD} onClick={() => setShowAddVideo(true)}>+ رفع فيديو</button>
              </div>
              <div className="rounded-2xl p-4 mb-4 flex items-start gap-3"
                style={{ background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.2)" }}>
                <span className="text-lg flex-shrink-0">📁</span>
                <div>
                  <div className="text-sm font-bold" style={{ color: "#93c5fd" }}>كيفية رفع فيديو من Google Drive</div>
                  <ol className="text-xs mt-1 space-y-0.5" style={{ color: "#6b82a0" }}>
                    <li>١. ارفع الفيديو على Google Drive</li>
                    <li>٢. انقر بزر اليمين على الفيديو ← مشاركة ← &quot;أي شخص لديه الرابط&quot;</li>
                    <li>٣. انسخ الرابط والصقه هنا</li>
                  </ol>
                </div>
              </div>
              {filteredVideos.length === 0 && (
                <div className="text-center py-12 rounded-2xl" style={{ background: "#0d1a2e", border: "1px solid #1c2f50" }}>
                  <div className="font-bold" style={{ color: "#6b82a0" }}>لا توجد فيديوهات</div>
                </div>
              )}
              <div className="grid gap-3">
                {filteredVideos.map(v => (
                  <div key={v.id} className="rounded-2xl p-5" style={{ background: "#0d1a2e", border: "1px solid #1c2f50" }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                          style={{ background: "rgba(245,158,11,0.12)", color: "#fbbf24" }}>▶</div>
                        <div className="min-w-0">
                          <div className="font-black" style={{ color: "#e8edf8" }}>{v.title}</div>
                          <div className="text-xs mt-0.5 flex items-center gap-2 flex-wrap" style={{ color: "#6b82a0" }}>
                            <span>{v.className}</span>
                            {v.duration && <span style={{ color: "#fbbf24" }}>{v.duration}</span>}
                            <span>{new Date(v.uploadedAt).toLocaleDateString("ar-IQ")}</span>
                          </div>
                          {v.description && <div className="text-xs mt-1" style={{ color: "#6b82a0" }}>{v.description}</div>}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <a href={v.driveUrl} target="_blank" rel="noopener noreferrer"
                          className="text-xs px-3 py-1.5 rounded-lg font-bold hover:scale-105 transition-all"
                          style={{ background: "rgba(37,99,235,0.12)", border: "1px solid rgba(37,99,235,0.25)", color: "#93c5fd", textDecoration: "none" }}>
                          معاينة
                        </a>
                        <button style={BTN_DANGER}
                          onClick={() => { if (confirm("حذف الفيديو؟")) { videosService.delete(v.id); reload() } }}>حذف</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Codes ── */}
          {tab === "codes" && (
            <div className="space-y-4">
              <h2 className="text-base font-black" style={{ color: "#e8edf8" }}>إدارة الأكواد</h2>

              <div className="rounded-2xl p-5" style={{ background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.2)" }}>
                <div className="font-bold mb-2 text-sm" style={{ color: "#93c5fd" }}>نظام الأكواد الذكي</div>
                <ul className="text-xs space-y-1" style={{ color: "#6b82a0" }}>
                  <li>• كل طالب يملك كود خاص من 6 أحرف/أرقام يعمل على جميع الأجهزة</li>
                  <li>• إذا استخدم شخصان الكود من أجهزة مختلفة — يُعلَّق الكود تلقائياً 15 دقيقة</li>
                  <li>• يمكنك رفع التعليق يدوياً أو تجديد الكود من هنا</li>
                </ul>
              </div>

              {/* Suspended */}
              <div className="rounded-2xl p-5" style={{ background: "#0d1a2e", border: `1px solid ${suspendedCount > 0 ? "rgba(239,68,68,0.3)" : "#1c2f50"}` }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full" style={{ background: suspendedCount > 0 ? "#ef4444" : "#6b7280" }} />
                  <h3 className="font-black text-sm" style={{ color: suspendedCount > 0 ? "#f87171" : "#6b82a0" }}>
                    الأكواد المعلقة ({suspendedCount})
                  </h3>
                </div>
                {suspendedCount === 0 ? (
                  <p className="text-sm" style={{ color: "#6b82a0" }}>لا توجد أكواد معلقة حالياً</p>
                ) : (
                  students.filter(s => s.isSuspended).map(s => (
                    <div key={s.id} style={{ ...CARD, marginBottom: 8 }}>
                      <div className="flex-1">
                        <div className="font-bold" style={{ color: "#e8edf8" }}>{s.name}</div>
                        <div className="text-xs" style={{ color: "#6b82a0" }}>{s.className}</div>
                      </div>
                      <span className="font-mono font-black text-base px-3 py-1.5 rounded-lg"
                        style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", letterSpacing: "0.2em", border: "1px solid rgba(239,68,68,0.25)" }}>
                        {s.code}
                      </span>
                      {s.suspendedUntil && (
                        <span className="text-xs" style={{ color: "#6b82a0" }}>حتى {new Date(s.suspendedUntil).toLocaleTimeString("ar")}</span>
                      )}
                      <button style={BTN_GHOST} onClick={() => unsuspend(s.id)}>رفع التعليق</button>
                    </div>
                  ))
                )}
              </div>

              {/* Renew */}
              <div className="rounded-2xl p-5" style={{ background: "#0d1a2e", border: "1px solid #1c2f50" }}>
                <h3 className="font-black text-sm mb-3" style={{ color: "#e8edf8" }}>تجديد الأكواد</h3>
                {students.map(s => (
                  <div key={s.id} style={{ ...CARD, marginBottom: 8 }}>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold truncate" style={{ color: "#e8edf8" }}>{s.name}</div>
                      <div className="text-xs" style={{ color: "#6b82a0" }}>{s.className}</div>
                    </div>
                    <button onClick={() => copyCode(s.code)}
                      className="font-mono font-black px-3 py-1.5 rounded-lg transition-all hover:scale-105 text-sm"
                      style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.25)", color: "#93c5fd", letterSpacing: "0.2em" }}>
                      {copied === s.code ? "✓ نسخ" : s.code}
                    </button>
                    <button style={{ ...BTN_GHOST, padding: "6px 14px", fontSize: 13 }}
                      onClick={async () => {
                        if (confirm(`تجديد كود ${s.name}؟ الكود القديم سيتوقف`)) {
                          const updated = await studentsService.update(s.id, { renewCode: true } as never)
                          setLastCode(updated.code)
                          await reload()
                          showToast(`الكود الجديد لـ ${s.name}: ${updated.code}`)
                        }
                      }}>
                      تجديد
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl font-bold text-sm shadow-2xl whitespace-nowrap"
          style={{
            background: toast.ok ? "rgba(16,185,129,0.95)" : "rgba(239,68,68,0.95)",
            color: "#fff",
            animation: "fadeInUp 0.3s ease-out forwards",
          }}>
          {toast.msg}
        </div>
      )}

      {/* ── Modals ── */}
      {showAddStudent && (
        <Modal title="إضافة طالب جديد" onClose={() => setShowAddStudent(false)}>
          <Label>اسم الطالب</Label>
          <input style={{ ...INP, marginBottom: 12 }} placeholder="الاسم الكامل" value={newName} onChange={e => setNewName(e.target.value)} />
          <Label>الفصل الدراسي</Label>
          <select style={{ ...INP, marginBottom: 12 }} value={newClass} onChange={e => setNewClass(e.target.value)}>
            <option value="">اختر الفصل</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="rounded-xl p-3 mb-4 text-xs text-center font-semibold"
            style={{ background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.2)", color: "#93c5fd" }}>
            سيتم توليد كود عشوائي فريد تلقائياً
          </div>
          <div className="flex gap-3">
            <button style={{ ...BTN_GOLD, flex: 1 }} onClick={handleAddStudent} disabled={!newName || !newClass}>إنشاء</button>
            <button style={{ ...BTN_GHOST, flex: 1 }} onClick={() => setShowAddStudent(false)}>إلغاء</button>
          </div>
        </Modal>
      )}

      {showAddVideo && (
        <Modal title="رفع فيديو من Google Drive" onClose={() => setShowAddVideo(false)}>
          <Label>عنوان الفيديو</Label>
          <input style={{ ...INP, marginBottom: 12 }} placeholder="مثال: درس المعادلات التربيعية" value={vTitle} onChange={e => setVTitle(e.target.value)} />
          <Label>الفصل</Label>
          <select style={{ ...INP, marginBottom: 12 }} value={vClass} onChange={e => setVClass(e.target.value)}>
            <option value="">اختر الفصل</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <Label>رابط Google Drive</Label>
          <input style={{ ...INP, textAlign: "left", direction: "ltr", marginBottom: 4 }}
            placeholder="https://drive.google.com/file/d/..." value={vUrl} onChange={e => setVUrl(e.target.value)} />
          <p className="text-xs mb-3" style={{ color: "#6b82a0" }}>تأكد من تغيير المشاركة إلى &quot;أي شخص لديه الرابط&quot;</p>
          <Label>مدة الفيديو (اختياري)</Label>
          <input style={{ ...INP, marginBottom: 12 }} placeholder="مثال: 45 دقيقة" value={vDuration} onChange={e => setVDuration(e.target.value)} />
          <Label>وصف الدرس (اختياري)</Label>
          <textarea style={{ ...INP, minHeight: 70, resize: "vertical", marginBottom: 16 }}
            placeholder="وصف مختصر" value={vDesc} onChange={e => setVDesc(e.target.value)} />
          <div className="flex gap-3">
            <button style={{ ...BTN_GOLD, flex: 1 }} onClick={handleAddVideo} disabled={!vTitle || !vUrl || !vClass}>رفع الفيديو</button>
            <button style={{ ...BTN_GHOST, flex: 1 }} onClick={() => setShowAddVideo(false)}>إلغاء</button>
          </div>
        </Modal>
      )}

      {showAddClass && (
        <Modal title="إضافة فصل دراسي" onClose={() => setShowAddClass(false)}>
          <Label>اسم الفصل</Label>
          <input style={{ ...INP, marginBottom: 12 }} placeholder="مثال: الصف الأول متوسط أ" value={cName} onChange={e => setCName(e.target.value)} />
          <Label>الصف الدراسي</Label>
          <input style={{ ...INP, marginBottom: 16 }} placeholder="مثال: 1" value={cGrade} onChange={e => setCGrade(e.target.value)} />
          <div className="flex gap-3">
            <button style={{ ...BTN_GOLD, flex: 1 }} onClick={handleAddClass} disabled={!cName}>إضافة</button>
            <button style={{ ...BTN_GHOST, flex: 1 }} onClick={() => setShowAddClass(false)}>إلغاء</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-bold mb-1" style={{ color: "#6b82a0" }}>{children}</div>
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl p-6"
        style={{ background: "#0d1a2e", border: "1px solid #1c2f50", boxShadow: "0 24px 80px rgba(0,0,0,0.5)", animation: "fadeInUp 0.3s ease-out forwards" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-black" style={{ color: "#e8edf8" }}>{title}</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
            style={{ background: "rgba(255,255,255,0.05)", color: "#6b82a0" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}
