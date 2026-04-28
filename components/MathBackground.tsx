"use client";

const symbols = [
  { sym: "∑", x: 5, y: 10, size: 48, delay: 0 },
  { sym: "∫", x: 88, y: 15, size: 56, delay: 1 },
  { sym: "π", x: 20, y: 75, size: 44, delay: 2 },
  { sym: "√", x: 75, y: 60, size: 52, delay: 0.5 },
  { sym: "∞", x: 45, y: 85, size: 40, delay: 1.5 },
  { sym: "Δ", x: 60, y: 20, size: 46, delay: 2.5 },
  { sym: "θ", x: 10, y: 45, size: 38, delay: 3 },
  { sym: "α", x: 92, y: 80, size: 42, delay: 0.8 },
  { sym: "±", x: 35, y: 30, size: 50, delay: 1.2 },
  { sym: "≈", x: 80, y: 40, size: 36, delay: 2.2 },
  { sym: "÷", x: 50, y: 50, size: 32, delay: 3.5 },
  { sym: "x²", x: 15, y: 90, size: 34, delay: 0.3 },
  { sym: "∀", x: 70, y: 90, size: 30, delay: 1.8 },
  { sym: "∂", x: 3, y: 60, size: 40, delay: 2.8 },
  { sym: "∇", x: 55, y: 8, size: 36, delay: 0.6 },
];

export default function MathBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {/* Grid pattern */}
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        style={{ opacity: 0.04 }}
      >
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#2563eb" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Glowing circles */}
      <div
        className="absolute rounded-full"
        style={{
          width: 500,
          height: 500,
          top: "-10%",
          right: "-8%",
          background: "radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: 400,
          height: 400,
          bottom: "-8%",
          left: "-5%",
          background: "radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: 300,
          height: 300,
          top: "40%",
          left: "40%",
          background: "radial-gradient(circle, rgba(37,99,235,0.06) 0%, transparent 70%)",
        }}
      />

      {/* Floating math symbols */}
      {symbols.map((s, i) => (
        <div
          key={i}
          className="absolute animate-float select-none font-mono font-bold"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            fontSize: s.size,
            color: i % 2 === 0 ? "#2563eb" : "#f59e0b",
            animationDelay: `${s.delay}s`,
            animationDuration: `${5 + s.delay}s`,
            opacity: 0.12,
          }}
        >
          {s.sym}
        </div>
      ))}
    </div>
  );
}
