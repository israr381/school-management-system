export default function SchoolIllustration() {
  return (
    <svg
      viewBox="0 0 220 180"
      className="h-40 w-52 sm:h-44 sm:w-56"
      aria-hidden
    >
      <ellipse cx="28" cy="148" rx="22" ry="8" fill="#059669" opacity="0.35" />
      <ellipse cx="192" cy="148" rx="22" ry="8" fill="#059669" opacity="0.35" />
      <rect x="22" y="118" width="10" height="32" rx="2" fill="#92400e" />
      <circle cx="27" cy="108" r="22" fill="#10b981" opacity="0.85" />
      <circle cx="18" cy="115" r="14" fill="#34d399" opacity="0.7" />
      <rect x="188" y="118" width="10" height="32" rx="2" fill="#92400e" />
      <circle cx="193" cy="108" r="22" fill="#10b981" opacity="0.85" />
      <circle cx="202" cy="115" r="14" fill="#34d399" opacity="0.7" />

      <rect x="52" y="72" width="116" height="78" rx="4" fill="#e0e7ff" />
      <rect x="52" y="72" width="116" height="78" rx="4" fill="url(#buildingShade)" />

      <rect x="96" y="38" width="28" height="112" rx="3" fill="#c7d2fe" />
      <polygon points="96,38 110,22 124,22 138,38" fill="#a5b4fc" />
      <circle cx="110" cy="58" r="10" fill="#fff" stroke="#6366f1" strokeWidth="2" />
      <line x1="110" y1="58" x2="110" y2="52" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="110" y1="58" x2="115" y2="58" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" />

      <line x1="124" y1="22" x2="124" y2="8" stroke="#64748b" strokeWidth="1.5" />
      <polygon points="124,8 138,12 124,16" fill="#ef4444" />

      {[0, 1, 2].map((col) =>
        [0, 1].map((row) => (
          <rect
            key={`${col}-${row}`}
            x={64 + col * 34}
            y={86 + row * 28}
            width="22"
            height="18"
            rx="3"
            fill="#818cf8"
            opacity="0.6"
          />
        )),
      )}

      <rect x="98" y="118" width="24" height="32" rx="3" fill="#6366f1" />
      <circle cx="116" cy="136" r="2" fill="#fbbf24" />

      <rect x="90" y="148" width="40" height="6" rx="1" fill="#94a3b8" opacity="0.5" />
      <rect x="86" y="154" width="48" height="6" rx="1" fill="#94a3b8" opacity="0.35" />

      <rect x="72" y="152" width="76" height="14" rx="3" fill="#4f46e5" />
    

      <circle cx="160" cy="30" r="3" fill="#fbbf24" opacity="0.8" />
      <circle cx="175" cy="45" r="2" fill="#f472b6" opacity="0.7" />
      <circle cx="45" cy="40" r="2.5" fill="#34d399" opacity="0.7" />
      <rect x="168" y="55" width="4" height="4" rx="1" fill="#60a5fa" opacity="0.6" transform="rotate(20 170 57)" />
      <rect x="50" y="55" width="3" height="3" rx="0.5" fill="#c084fc" opacity="0.6" transform="rotate(-15 51 56)" />

      <defs>
        <linearGradient id="buildingShade" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.08" />
        </linearGradient>
      </defs>
    </svg>
  );
}
