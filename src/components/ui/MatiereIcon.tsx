interface MatiereIconProps {
  code: string
  couleur: string
  size?: number
}

export default function MatiereIcon({ code, couleur, size = 28 }: MatiereIconProps) {
  const icons: Record<string, JSX.Element> = {
    MATH: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={couleur} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
        <line x1="5" y1="7" x2="10" y2="7" />
        <line x1="14" y1="17" x2="19" y2="17" />
        <line x1="14" y1="14" x2="19" y2="20" />
        <line x1="14" y1="20" x2="19" y2="14" />
      </svg>
    ),
    PC: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={couleur} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
    ),
    SVT: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={couleur} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22V12" />
        <path d="M12 12C12 12 7 10 5 6c3 0 5.5 1.5 7 6z" />
        <path d="M12 12C12 12 17 10 19 6c-3 0-5.5 1.5-7 6z" />
        <path d="M12 12C12 12 9 7 9 3c2 1 3.5 4 3 9z" />
        <path d="M12 12C12 12 15 7 15 3c-2 1-3.5 4-3 9z" />
      </svg>
    ),
    FR: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={couleur} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <line x1="8" y1="8" x2="16" y2="8" />
        <line x1="8" y1="12" x2="14" y2="12" />
      </svg>
    ),
    HG: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={couleur} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    EN: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={couleur} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <line x1="9" y1="10" x2="15" y2="10" />
        <line x1="12" y1="7" x2="12" y2="13" />
      </svg>
    ),
    PHILO: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={couleur} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M12 12v4" />
        <path d="M8 18h8" />
        <path d="M9 21h6" />
        <path d="M9 3.5C7 4.5 6 6.5 7 8.5" />
        <path d="M15 3.5c2 1 3 3 2 5" />
      </svg>
    ),
    ECO: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={couleur} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    INFO: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={couleur} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
        <polyline points="9 9 12 12 15 9" />
      </svg>
    ),
  }

  const icon = icons[code.toUpperCase()]

  if (!icon) {
    // Fallback: première lettre stylisée
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <text
          x="12" y="16"
          textAnchor="middle"
          fontSize="14"
          fontWeight="bold"
          fill={couleur}
          fontFamily="sans-serif"
        >
          {code.charAt(0)}
        </text>
      </svg>
    )
  }

  return icon
}
