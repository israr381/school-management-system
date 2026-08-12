export default function SystemIllustration() {
  return (
    <svg viewBox="0 0 220 180" className="h-40 w-52 sm:h-44 sm:w-56" aria-hidden>
      {/* Platform base */}
      <ellipse cx="110" cy="158" rx="72" ry="10" fill="#6366f1" opacity="0.2" />

      {/* Center hub */}
      <circle cx="110" cy="88" r="28" fill="#818cf8" opacity="0.9" />
      <circle cx="110" cy="88" r="18" fill="#4f46e5" />
      <circle cx="110" cy="88" r="6" fill="white" opacity="0.9" />

      {/* Connection lines */}
      <line x1="110" y1="60" x2="110" y2="38" stroke="#a5b4fc" strokeWidth="2" strokeDasharray="4 3" />
      <line x1="138" y1="88" x2="168" y2="88" stroke="#a5b4fc" strokeWidth="2" strokeDasharray="4 3" />
      <line x1="82" y1="88" x2="52" y2="88" stroke="#a5b4fc" strokeWidth="2" strokeDasharray="4 3" />
      <line x1="128" y1="108" x2="152" y2="132" stroke="#a5b4fc" strokeWidth="2" strokeDasharray="4 3" />
      <line x1="92" y1="108" x2="68" y2="132" stroke="#a5b4fc" strokeWidth="2" strokeDasharray="4 3" />

      {/* Org nodes — mini buildings */}
      {[
        { x: 110, y: 28, label: "ORG" },
        { x: 178, y: 88, label: "ORG" },
        { x: 42, y: 88, label: "ORG" },
        { x: 160, y: 140, label: "ORG" },
        { x: 60, y: 140, label: "ORG" },
      ].map((node, i) => (
        <g key={i}>
          <rect
            x={node.x - 16}
            y={node.y - 14}
            width="32"
            height="28"
            rx="6"
            fill="white"
            fillOpacity="0.2"
            stroke="white"
            strokeOpacity="0.35"
            strokeWidth="1.5"
          />
          <rect x={node.x - 8} y={node.y - 6} width="16" height="12" rx="2" fill="white" opacity="0.5" />
          <text
            x={node.x}
            y={node.y + 22}
            textAnchor="middle"
            fill="white"
            fontSize="7"
            fontWeight="600"
            opacity="0.8"
          >
            {node.label}
          </text>
        </g>
      ))}

      {/* Confetti */}
      <circle cx="175" cy="30" r="3" fill="#fbbf24" opacity="0.7" />
      <circle cx="40" cy="45" r="2" fill="#34d399" opacity="0.6" />
      <rect x="185" y="50" width="4" height="4" rx="1" fill="#f472b6" opacity="0.5" transform="rotate(15 187 52)" />
    </svg>
  );
}
