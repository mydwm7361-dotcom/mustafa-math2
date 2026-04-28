"use client"

import { useState, useEffect, useRef } from "react"
import { sessionsService, getDeviceId, adminService } from "@/lib/api"
import type { Student } from "@/lib/types"

interface LoginPageProps {
  onStudentLogin: (student: Student) => void
  onAdminLogin: () => void
}

export default function LoginPage({ onStudentLogin, onAdminLogin }: LoginPageProps) {
  const [code, setCode] = useState(["", "", "", "", "", ""])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showAdmin, setShowAdmin] = useState(false)
  const [adminPass, setAdminPass] = useState("")
  const [adminError, setAdminError] = useState("")
  const [adminClickCount, setAdminClickCount] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [particles, setParticles] = useState<{x:number;y:number;s:number;d:number}[]>([])

  useEffect(() => {
    const p = Array.from({ length: 20 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      s: Math.random() * 20 + 10,
      d: Math.random() * 6 + 4
    }))
    setParticles(p)
  }, [])

  const handleCodeInput = (idx: number, val: string) => {
    const char = val.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(-1)
    const newCode = [...code]
    newCode[idx] = char
    setCode(newCode)
    if (char && idx < 5) {
      inputRefs.current[idx + 1]?.focus()
    }
    setError("")
  }

  const handleCodeKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus()
    }
  }

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6)
    const newCode = [...code]
    for (let i = 0; i < 6; i++) {
      newCode[i] = pasted[i] || ""
    }
    setCode(newCode)
    inputRefs.current[Math.min(pasted.length, 5)]?.focus()
  }

  const handleLogin = async () => {
    const fullCode = code.join("").toUpperCase().trim()
    if (fullCode.length !== 6) { setError("الرجاء إدخال الكود كاملاً (6 خانات)"); return }
    setLoading(true)
    setError("")
    try {
      const deviceId = getDeviceId()
      const result = await sessionsService.login(fullCode, deviceId)
      if (result.success && result.student) {
        onStudentLogin(result.student)
      } else {
        setError(result.message)
      }
    } catch {
      setError("حدث خطأ في الاتصال، حاول مرة أخرى")
    }
    setLoading(false)
  }

  const handleAdminLogin = () => {
    if (adminService.login(adminPass)) {
      onAdminLogin()
    } else {
      setAdminError("كلمة المرور غير صحيحة")
    }
  }

  const logoClick = () => {
    setAdminClickCount(p => {
      if (p + 1 >= 7) { setShowAdmin(true); return 0 }
      return p + 1
    })
  }

  const mathSymbols = ["∫", "∑", "π", "√", "∞", "△", "θ", "α", "β", "dx", "f(x)", "x²", "±", "≠", "≤"]

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center p-4" dir="rtl">
      {/* Animated background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((p, i) => (
          <div
            key={i}
            className="absolute text-primary/10 font-bold select-none"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              fontSize: `${p.s}px`,
              animation: `float ${p.d}s ease-in-out infinite alternate`,
              animationDelay: `${i * 0.3}s`,
            }}
          >
            {mathSymbols[i % mathSymbols.length]}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); opacity: 0.05; }
          100% { transform: translateY(-30px) rotate(10deg); opacity: 0.2; }
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .shimmer-text {
          background: linear-gradient(90deg, oklch(0.65 0.18 50), oklch(0.8 0.15 80), oklch(0.65 0.18 50));
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }
        .code-input {
          transition: all 0.2s ease;
        }
        .code-input:focus {
          transform: scale(1.1);
          box-shadow: 0 0 0 3px oklch(0.65 0.18 50 / 0.4), 0 0 20px oklch(0.65 0.18 50 / 0.2);
        }
        .code-input.filled {
          border-color: oklch(0.65 0.18 50);
          background: oklch(0.15 0.04 50 / 0.3);
          color: oklch(0.85 0.15 60);
        }
      `}</style>

      {/* Main card */}
      <div className="relative w-full max-w-md z-10">
        {/* Logo area */}
        <div className="flex flex-col items-center mb-8" onClick={logoClick}>
          <div className="relative cursor-pointer">
            <div className="w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mb-4 relative">
              <div className="absolute inset-0 rounded-full bg-primary/5 animate-ping" style={{ animationDuration: "3s" }} />
              <span className="text-4xl font-black shimmer-text">م.ك</span>
            </div>
          </div>
          <h1 className="text-3xl font-black text-foreground text-balance text-center">
            أ. مصطفى كريم
          </h1>
          <p className="text-muted-foreground mt-1 text-center font-medium">منصة الرياضيات التعليمية</p>
          <div className="flex items-center gap-2 mt-3">
            <span className="w-8 h-px bg-primary/40" />
            <span className="text-primary text-xs font-bold">∫ π √ ∑ ∞</span>
            <span className="w-8 h-px bg-primary/40" />
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl">
          {!showAdmin ? (
            <>
              <h2 className="text-xl font-bold text-foreground text-center mb-2">أدخل كودك للدخول</h2>
              <p className="text-muted-foreground text-sm text-center mb-6">
                الكود مكون من 6 خانات - أحرف وأرقام
              </p>

              {/* Code inputs */}
              <div className="flex gap-2 justify-center mb-6 ltr" dir="ltr" onPaste={handleCodePaste}>
                {code.map((char, i) => (
                  <input
                    key={i}
                    ref={el => { inputRefs.current[i] = el }}
                    type="text"
                    maxLength={1}
                    value={char}
                    onChange={e => handleCodeInput(i, e.target.value)}
                    onKeyDown={e => handleCodeKeyDown(i, e)}
                    className={`code-input w-12 h-14 text-center text-xl font-black border-2 rounded-xl bg-secondary outline-none uppercase ${char ? "filled" : "border-border text-foreground"}`}
                    placeholder="-"
                  />
                ))}
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 mb-4">
                  <p className="text-destructive text-sm text-center font-medium">{error}</p>
                </div>
              )}

              <button
                onClick={handleLogin}
                disabled={loading || code.join("").length !== 6}
                className="w-full h-14 rounded-xl font-black text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                style={{
                  background: "oklch(0.65 0.18 50)",
                  color: "oklch(0.08 0.02 250)",
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    جاري التحقق...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    دخول
                  </span>
                )}
              </button>

              <p className="text-center text-xs text-muted-foreground mt-4">
                لا تملك كوداً؟ تواصل مع الأستاذ مصطفى للحصول على كودك
              </p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-foreground text-center mb-6">دخول الأستاذ</h2>
              <input
                type="password"
                value={adminPass}
                onChange={e => setAdminPass(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAdminLogin()}
                placeholder="كلمة مرور الأستاذ"
                className="w-full h-12 px-4 rounded-xl border-2 border-border bg-secondary text-foreground outline-none focus:border-primary mb-3 text-center font-bold"
              />
              {adminError && <p className="text-destructive text-sm text-center mb-3">{adminError}</p>}
              <button
                onClick={handleAdminLogin}
                className="w-full h-12 rounded-xl font-bold text-base"
                style={{ background: "oklch(0.55 0.2 230)", color: "white" }}
              >
                دخول
              </button>
              <button
                onClick={() => { setShowAdmin(false); setAdminError("") }}
                className="w-full h-10 rounded-xl font-medium text-sm text-muted-foreground mt-2 hover:text-foreground transition-colors"
              >
                رجوع
              </button>
            </>
          )}
        </div>

        {/* Contact */}
        <div className="mt-6 bg-card border border-border rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="https://t.me/teto9900"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-bold hover:text-primary transition-colors"
            style={{ color: "oklch(0.65 0.18 50)" }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 14.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z"/>
            </svg>
            @teto9900
          </a>
          <span className="hidden sm:block text-border">|</span>
          <a
            href="tel:07505336209"
            className="flex items-center gap-2 text-sm font-bold hover:text-primary transition-colors"
            style={{ color: "oklch(0.65 0.18 50)" }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 7V5z" />
            </svg>
            07505336209
          </a>
        </div>
      </div>
    </div>
  )
}
