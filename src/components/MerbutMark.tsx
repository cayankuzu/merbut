interface MerbutMarkProps {
  className?: string
}

export function MerbutMark({ className }: MerbutMarkProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" role="img" aria-label="Merbut amblemi">
      <defs>
        <linearGradient id="merbut-mark-fire" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f7c65f" />
          <stop offset="0.52" stopColor="#ff5a42" />
          <stop offset="1" stopColor="#ff245f" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="27" fill="#130308" stroke="url(#merbut-mark-fire)" strokeWidth="2" />
      <path d="M13 32c5-13 13-19 24-17 8 1 14 7 15 15-1 10-8 17-18 18-8 0-14-4-17-10 5 5 10 7 16 6 8-1 13-6 14-13-1-6-5-10-11-11-8-1-14 3-18 12Z" fill="none" stroke="#ff526d" strokeWidth="2.5" strokeLinecap="round" />
      <path d="m21 47 7-27 4 17 5-17 6 27-11-7Z" fill="#fff3d8" stroke="#f7c65f" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="32" cy="34" r="3" fill="#ff315f" />
    </svg>
  )
}
