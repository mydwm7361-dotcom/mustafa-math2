"use client";

import { useState, useEffect, useRef } from "react";
import { videosService, classesService, progressService } from "@/lib/api";
import type { Student, Video, ClassRoom } from "@/lib/types";

interface Props {
  student: Student;
  onLogout: () => void;
}

type Tab = "videos" | "progress" | "contact";

export default function StudentDashboard({ student, onLogout }: Props) {
  const [tab, setTab] = useState<Tab>("videos");
  const [videos, setVideos] = useState<Video[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [mounted, setMounted] = useState(false);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const [watchSeconds, setWatchSeconds] = useState(0);

  useEffect(() => {
    setMounted(true);
    async function load() {
      const [allVideos, allClasses, allProgress] = await Promise.all([
        videosService.getAll(),
        classesService.getAll(),
        progressService.getByStudent(student.id),
      ]);
      const myVideos = allVideos.filter(v => v.classId === student.classId);
      setVideos(myVideos);
      setClasses(allClasses);
      const prog: Record<string, number> = {};
      for (const p of allProgress) prog[p.videoId] = p.progress;
      setProgress(prog);
    }
    load();
  }, [student]);

  function handleOpenVideo(video: Video) {
    setSelectedVideo(video);
    setWatchSeconds(0);
    // Start progress tracking
    progressInterval.current && clearInterval(progressInterval.current);
    progressInterval.current = setInterval(() => {
      setWatchSeconds(s => s + 1);
    }, 1000);
  }

  async function handleCloseVideo() {
    progressInterval.current && clearInterval(progressInterval.current);
    setSelectedVideo(null);
  }

  async function handleProgressUpdate(videoId: string, pct: number) {
    const capped = Math.min(Math.round(pct), 100);
    await progressService.update(videoId, student.id, capped);
    setProgress(prev => ({ ...prev, [videoId]: capped }));
  }

  function handleLogout() {
    progressInterval.current && clearInterval(progressInterval.current);
    onLogout();
  }

  const myClass = classes.find(c => c.id === student.classId);
  const totalProgress = videos.length > 0
    ? Math.round(Object.values(progress).reduce((a, b) => a + b, 0) / videos.length)
    : 0;
  const completedCount = Object.values(progress).filter(p => p >= 90).length;

  if (!mounted) return null;

  return (
    <div className="min-h-screen relative z-10" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b" style={{ background: "rgba(8,16,30,0.92)", backdropFilter: "blur(14px)", borderColor: "var(--border)" }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm"
              style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)", color: "#fff", boxShadow: "0 0 16px rgba(37,99,235,0.4)" }}>
              ∑
            </div>
            <div>
              <div className="font-black text-sm" style={{ color: "var(--foreground)" }}>أ. مصطفى كريم</div>
              <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>منصة الرياضيات</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "rgba(37,99,235,0.12)", border: "1px solid rgba(37,99,235,0.2)" }}>
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-bold" style={{ color: "#93c5fd" }}>{student.name}</span>
            </div>
            <button onClick={handleLogout} className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all hover:scale-105"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}>
              خروج
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Welcome card */}
        <div className="rounded-2xl p-6 mb-6 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0f1a2e, #1a2a42)", border: "1px solid var(--border)" }}>
          <div className="absolute top-0 left-0 w-full h-full opacity-5">
            <div className="text-9xl font-black absolute -top-4 -left-4 select-none">∑</div>
          </div>
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <div className="text-xs font-bold mb-1" style={{ color: "var(--muted-foreground)" }}>مرحباً بك في المنصة</div>
              <h1 className="text-2xl font-black mb-1" style={{ color: "var(--foreground)" }}>{student.name}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs px-2 py-1 rounded-lg font-bold"
                  style={{ background: "rgba(37,99,235,0.2)", border: "1px solid rgba(37,99,235,0.35)", color: "#93c5fd" }}>
                  {myClass?.name || "فصلي"}
                </span>
                <span className="text-xs px-2 py-1 rounded-lg font-bold font-mono"
                  style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "#fbbf24" }}>
                  كود: {student.code}
                </span>
              </div>
            </div>
            {/* Overall progress ring */}
            <div className="flex flex-col items-center gap-1">
              <ProgressRing pct={totalProgress} size={80} />
              <span className="text-xs font-bold" style={{ color: "var(--muted-foreground)" }}>إجمالي التقدم</span>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            {[
              { label: "الدروس", val: videos.length, color: "#93c5fd" },
              { label: "أنهيت", val: completedCount, color: "#34d399" },
              { label: "% إنجاز", val: `${totalProgress}%`, color: "#fbbf24" },
            ].map((s, i) => (
              <div key={i} className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="text-xl font-black" style={{ color: s.color }}>{s.val}</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
          {([
            { id: "videos", label: "درسي", icon: "▶" },
            { id: "progress", label: "تقدمي", icon: "📊" },
            { id: "contact", label: "تواصل", icon: "💬" },
          ] as { id: Tab; label: string; icon: string }[]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 flex items-center justify-center gap-1.5"
              style={
                tab === t.id
                  ? { background: "var(--primary)", color: "#fff", boxShadow: "0 4px 12px rgba(37,99,235,0.35)" }
                  : { color: "var(--muted-foreground)" }
              }
            >
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        {/* Videos Tab */}
        {tab === "videos" && (
          <div>
            {videos.length === 0 ? (
              <div className="text-center py-16 rounded-2xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="text-5xl mb-3 opacity-30">📹</div>
                <div className="font-bold" style={{ color: "var(--muted-foreground)" }}>لا توجد فيديوهات لفصلك بعد</div>
                <div className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>سيضيف أستاذ مصطفى الدروس قريباً</div>
              </div>
            ) : (
              <div className="grid gap-4">
                {videos.map((video, idx) => {
                  const pct = progress[video.id] || 0;
                  return (
                    <div
                      key={video.id}
                      className="rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:scale-[1.01]"
                      style={{
                        background: "var(--card)",
                        border: `1px solid ${pct >= 90 ? "rgba(16,185,129,0.4)" : pct > 0 ? "rgba(37,99,235,0.4)" : "var(--border)"}`,
                        boxShadow: pct >= 90 ? "0 4px 24px rgba(16,185,129,0.1)" : "none",
                      }}
                      onClick={() => handleOpenVideo(video)}
                    >
                      <div className="flex items-start gap-4">
                        {/* Thumbnail placeholder */}
                        <div className="relative w-24 h-16 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
                          style={{ background: "linear-gradient(135deg,#1d4ed8,#1e3a8a)" }}>
                          <span className="text-3xl font-black text-white opacity-60">{idx + 1}</span>
                          {pct >= 90 && (
                            <div className="absolute inset-0 flex items-center justify-center"
                              style={{ background: "rgba(16,185,129,0.85)" }}>
                              <span className="text-2xl text-white">✓</span>
                            </div>
                          )}
                          {pct > 0 && pct < 90 && (
                            <div className="absolute bottom-0 left-0 right-0 h-1"
                              style={{ background: "rgba(0,0,0,0.4)" }}>
                              <div style={{ width: `${pct}%`, height: "100%", background: "#2563eb" }} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-black text-base leading-tight" style={{ color: "var(--foreground)" }}>{video.title}</h3>
                            <span className="text-xs px-2 py-1 rounded-lg flex-shrink-0 font-bold"
                              style={{
                                background: pct >= 90 ? "rgba(16,185,129,0.15)" : "rgba(37,99,235,0.1)",
                                color: pct >= 90 ? "#34d399" : "#93c5fd",
                                border: `1px solid ${pct >= 90 ? "rgba(16,185,129,0.3)" : "rgba(37,99,235,0.25)"}`,
                              }}>
                              {pct >= 90 ? "مكتمل" : pct > 0 ? `${pct}%` : "جديد"}
                            </span>
                          </div>
                          {video.description && (
                            <p className="text-sm mt-1 line-clamp-2" style={{ color: "var(--muted-foreground)" }}>{video.description}</p>
                          )}
                          <div className="mt-3">
                            <div className="flex justify-between text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>
                              <span>التقدم</span>
                              <span className="font-bold" style={{ color: pct >= 90 ? "#34d399" : "var(--muted-foreground)" }}>{pct}%</span>
                            </div>
                            <div className="progress-bar">
                              <div className="progress-fill" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Progress Tab */}
        {tab === "progress" && (
          <div className="space-y-4">
            <div className="rounded-2xl p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <h2 className="font-black text-lg mb-4" style={{ color: "var(--foreground)" }}>تقرير إنجازاتي</h2>
              {videos.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>لا توجد دروس بعد</p>
              ) : (
                <div className="space-y-4">
                  {videos.map((v) => {
                    const pct = progress[v.id] || 0;
                    return (
                      <div key={v.id}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{v.title}</span>
                          <span className="text-sm font-black" style={{
                            color: pct >= 90 ? "#34d399" : pct > 50 ? "#fbbf24" : "var(--muted-foreground)"
                          }}>{pct}%</span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl p-5 text-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <ProgressRing pct={totalProgress} size={100} />
                <div className="mt-2 font-bold text-sm" style={{ color: "var(--muted-foreground)" }}>متوسط الإنجاز</div>
              </div>
              <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <StatBubble label="دروس مكتملة" val={completedCount} color="#34d399" />
                <StatBubble label="قيد المشاهدة" val={Object.values(progress).filter(p => p > 0 && p < 90).length} color="#fbbf24" />
                <StatBubble label="لم تبدأ" val={videos.length - Object.values(progress).filter(p => p > 0).length} color="var(--muted-foreground)" />
              </div>
            </div>
          </div>
        )}

        {/* Contact Tab */}
        {tab === "contact" && (
          <div className="space-y-4">
            <div className="rounded-2xl p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white"
                  style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)", boxShadow: "0 0 24px rgba(37,99,235,0.4)" }}>
                  م.ك
                </div>
                <div>
                  <h2 className="text-xl font-black" style={{ color: "var(--foreground)" }}>أ. مصطفى كريم</h2>
                  <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>مدرس الرياضيات</p>
                </div>
              </div>
              <div className="grid gap-3">
                <a href="https://t.me/teto9900" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-xl transition-all hover:scale-[1.02]"
                  style={{ background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.2)" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(37,99,235,0.15)" }}>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#2563eb">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-2.027 9.546c-.143.676-.529.84-1.072.522l-2.968-2.186-1.432 1.378c-.158.158-.293.293-.601.293l.213-3.024 5.508-4.975c.24-.213-.052-.33-.371-.117L7.27 14.232l-2.926-.914c-.635-.198-.648-.635.133-.94l11.414-4.398c.528-.19.99.128.671.268z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-bold text-sm" style={{ color: "var(--foreground)" }}>تيليغرام</div>
                    <div className="text-xs" style={{ color: "#93c5fd" }}>@teto9900</div>
                  </div>
                </a>
                <a href="tel:07505336209"
                  className="flex items-center gap-4 p-4 rounded-xl transition-all hover:scale-[1.02]"
                  style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(245,158,11,0.12)" }}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#f59e0b" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 7V5z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-bold text-sm" style={{ color: "var(--foreground)" }}>رقم الهاتف</div>
                    <div className="text-xs" style={{ color: "#fbbf24" }}>07505336209</div>
                  </div>
                </a>
              </div>
            </div>
            <div className="rounded-2xl p-5 text-center" style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.2)" }}>
              <p className="text-sm font-bold" style={{ color: "#34d399" }}>لا تشارك كودك مع أحد</p>
              <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>الكود شخصي - مشاركته تؤدي إلى تعليق الحساب</p>
            </div>
          </div>
        )}
      </div>

      {/* Video Modal */}
      {selectedVideo && (
        <VideoModal
          video={selectedVideo}
          studentId={student.id}
          savedProgress={progress[selectedVideo.id] || 0}
          onClose={handleCloseVideo}
          onProgress={(pct) => handleProgressUpdate(selectedVideo.id, pct)}
        />
      )}
    </div>
  );
}

// ---- Video Modal ----
function VideoModal({
  video, studentId, savedProgress, onClose, onProgress
}: {
  video: Video;
  studentId: string;
  savedProgress: number;
  onClose: () => void;
  onProgress: (pct: number) => void;
}) {
  const [currentPct, setCurrentPct] = useState(savedProgress);
  const [manualPct, setManualPct] = useState(savedProgress);
  const [driveEmbedUrl, setDriveEmbedUrl] = useState("");

  useEffect(() => {
    // Convert drive URL to embed format if needed
    let url = video.driveUrl;
    const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match) {
      url = `https://drive.google.com/file/d/${match[1]}/preview`;
    }
    setDriveEmbedUrl(url);
    setCurrentPct(savedProgress);
    setManualPct(savedProgress);
  }, [video, savedProgress]);

  function handleSaveProgress() {
    const capped = Math.min(100, Math.max(0, manualPct));
    setCurrentPct(capped);
    onProgress(capped);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-2xl overflow-hidden"
        style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 24px 80px rgba(0,0,0,0.5)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--border)" }}>
          <h3 className="font-black text-base" style={{ color: "var(--foreground)" }}>{video.title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
            style={{ background: "rgba(239,68,68,0.15)", color: "#f87171" }}>
            ✕
          </button>
        </div>

        {/* Video embed */}
        <div className="relative" style={{ paddingTop: "56.25%" }}>
          {driveEmbedUrl ? (
            <iframe
              src={driveEmbedUrl}
              className="absolute inset-0 w-full h-full"
              allow="autoplay; encrypted-media"
              allowFullScreen
              style={{ border: "none" }}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
              style={{ background: "#0f1a2e" }}>
              <div className="text-5xl opacity-30">🎬</div>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>رابط الفيديو غير صحيح</p>
            </div>
          )}
        </div>

        {/* Progress tracker */}
        <div className="p-4" style={{ background: "rgba(0,0,0,0.2)" }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>نسبة المشاهدة</span>
            <span className="text-sm font-black" style={{ color: currentPct >= 90 ? "#34d399" : "#93c5fd" }}>{currentPct}%</span>
          </div>
          <div className="progress-bar mb-4">
            <div className="progress-fill" style={{ width: `${currentPct}%` }} />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold flex-shrink-0" style={{ color: "var(--muted-foreground)" }}>حدّث التقدم:</span>
            <input
              type="range"
              min={0}
              max={100}
              value={manualPct}
              onChange={e => setManualPct(Number(e.target.value))}
              className="flex-1 accent-blue-500"
            />
            <span className="text-sm font-black w-10 text-center" style={{ color: "var(--foreground)" }}>{manualPct}%</span>
            <button
              onClick={handleSaveProgress}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105 flex-shrink-0"
              style={{ background: "var(--primary)", color: "#fff" }}
            >
              حفظ
            </button>
          </div>

          {currentPct >= 90 && (
            <div className="mt-3 p-3 rounded-xl text-center text-sm font-bold animate-fadeInUp"
              style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#34d399" }}>
              ممتاز! أنهيت هذا الدرس
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- Progress Ring ----
function ProgressRing({ pct, size }: { pct: number; size: number }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={6} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={pct >= 90 ? "#10b981" : "#2563eb"}
        strokeWidth={6}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
        style={{ fill: "var(--foreground)", fontSize: size * 0.2, fontWeight: 900, fontFamily: "Cairo,sans-serif" }}>
        {pct}%
      </text>
    </svg>
  );
}

// ---- Stat Bubble ----
function StatBubble({ label, val, color }: { label: string; val: number; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{label}</span>
      <span className="text-lg font-black" style={{ color }}>{val}</span>
    </div>
  );
}
