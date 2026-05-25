export function SalesFoxIcon({ size = 32, className = '' }: { size?: number; className?: string }) {
  const id = `sfg-${size}`
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>

      {/* Left ear */}
      <path d="M7 21 L12.5 5 L19 21" fill={`url(#${id})`} />
      {/* Right ear */}
      <path d="M21 21 L27.5 5 L33 21" fill={`url(#${id})`} />
      {/* Inner ear shading */}
      <path d="M9.5 20 L12.5 9 L17 20" fill="#1e40af" opacity="0.45" />
      <path d="M23 20 L27.5 9 L31 20" fill="#1e40af" opacity="0.45" />

      {/* Head */}
      <circle cx="20" cy="25" r="13" fill={`url(#${id})`} />

      {/* Cheek / muzzle highlight */}
      <ellipse cx="20" cy="29" rx="6.5" ry="4" fill="#93c5fd" opacity="0.35" />

      {/* Eyes */}
      <circle cx="15" cy="23" r="2.8" fill="white" opacity="0.95" />
      <circle cx="25" cy="23" r="2.8" fill="white" opacity="0.95" />
      {/* Pupils */}
      <circle cx="15.4" cy="23.3" r="1.4" fill="#1e3a8a" />
      <circle cx="25.4" cy="23.3" r="1.4" fill="#1e3a8a" />
      {/* Eye shine */}
      <circle cx="14.6" cy="22.4" r="0.55" fill="white" opacity="0.7" />
      <circle cx="24.6" cy="22.4" r="0.55" fill="white" opacity="0.7" />

      {/* Nose */}
      <ellipse cx="20" cy="28.5" rx="2.2" ry="1.6" fill="white" opacity="0.7" />

      {/* Subtle upward trend line on forehead */}
      <path d="M14 15 L17 13 L20 14 L23 11" stroke="white" strokeWidth="1.4"
        strokeLinecap="round" strokeLinejoin="round" opacity="0.45" />
    </svg>
  )
}
