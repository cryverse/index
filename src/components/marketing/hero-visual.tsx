export function HeroVisual() {
  return (
    <div
      className="hero-visual-float relative aspect-[16/10] w-full max-w-full overflow-hidden rounded-xl border border-border-subtle bg-surface/80"
      aria-hidden
    >
      <div className="absolute inset-0 marketing-grid-bg opacity-60" />
      <div className="absolute inset-0 gradient-radial-accent" />

      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 640 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop stopColor="#3b82f6" stopOpacity="0" />
            <stop offset="0.5" stopColor="#3b82f6" stopOpacity="0.8" />
            <stop offset="1" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path
          className="hero-line-draw"
          d="M80 280 Q 200 120, 320 200 T 560 140"
          stroke="url(#lineGrad)"
          strokeWidth="1.5"
        />
        <path
          d="M100 320 C 180 260, 260 300, 340 220 S 480 180, 540 240"
          stroke="rgba(59,130,246,0.25)"
          strokeWidth="1"
        />

        {[
          [80, 280],
          [200, 160],
          [320, 200],
          [440, 170],
          [560, 140],
        ].map(([cx, cy], i) => (
          <g key={i}>
            <circle cx={cx} cy={cy} r="4" fill="#3b82f6" fillOpacity={0.9} />
            <circle
              className="hero-node-pulse"
              cx={cx}
              cy={cy}
              r="12"
              stroke="#3b82f6"
              strokeOpacity={0.3}
              style={{ animationDelay: `${i * 0.4}s` }}
            />
          </g>
        ))}

        <rect
          x="48"
          y="48"
          width="140"
          height="72"
          rx="8"
          stroke="rgba(255,255,255,0.1)"
          fill="rgba(255,255,255,0.02)"
        />
        <rect
          x="48"
          y="136"
          width="100"
          height="8"
          rx="2"
          fill="rgba(255,255,255,0.15)"
        />
        <rect
          x="48"
          y="152"
          width="80"
          height="6"
          rx="2"
          fill="rgba(255,255,255,0.08)"
        />

        <rect
          x="452"
          y="260"
          width="140"
          height="100"
          rx="8"
          stroke="rgba(59,130,246,0.3)"
          fill="rgba(59,130,246,0.06)"
        />
        <polyline
          points="468,330 500,290 530,310 560,270 580,285"
          stroke="#3b82f6"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeOpacity="0.7"
        />
      </svg>

      <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-3 border-t border-border-subtle pt-2 font-mono text-[10px] text-muted sm:inset-x-4 sm:bottom-4 sm:pt-3 sm:text-[11px]">
        <span className="min-w-0 truncate">signal_density · normalized</span>
        <span className="shrink-0 text-accent">live synthesis</span>
      </div>
    </div>
  );
}