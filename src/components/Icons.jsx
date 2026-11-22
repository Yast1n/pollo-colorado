const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

export const IconBag = (p) => (
  <svg {...base} {...p}>
    <path d="M6 7h12l-1 13H7L6 7Z" />
    <path d="M9 7a3 3 0 0 1 6 0" />
  </svg>
)
export const IconPlus = (p) => (
  <svg {...base} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)
export const IconMinus = (p) => (
  <svg {...base} {...p}>
    <path d="M5 12h14" />
  </svg>
)
export const IconCheck = (p) => (
  <svg {...base} {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
)
export const IconClose = (p) => (
  <svg {...base} {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
)
export const IconScale = (p) => (
  <svg {...base} {...p}>
    <path d="M5 8h14l-1.5 12h-11L5 8Z" />
    <path d="M12 8V4M9 4h6" />
  </svg>
)
export const IconUsers = (p) => (
  <svg {...base} {...p}>
    <circle cx="9" cy="8" r="3" />
    <path d="M3 20a6 6 0 0 1 12 0" />
    <path d="M16 5a3 3 0 0 1 0 6M21 20a6 6 0 0 0-3-5.2" />
  </svg>
)
export const IconPin = (p) => (
  <svg {...base} {...p}>
    <path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12Z" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
)
export const IconClock = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
)
export const IconFlame = (p) => (
  <svg {...base} {...p}>
    <path d="M12 3c3 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-5 3-6 .5 2 1.5 3 3 3-1-3 0-6 0-8Z" />
  </svg>
)
export const IconTrash = (p) => (
  <svg {...base} {...p}>
    <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
  </svg>
)
export const IconEdit = (p) => (
  <svg {...base} {...p}>
    <path d="M4 20h4L19 9l-4-4L4 16v4Z" />
  </svg>
)
export const IconImage = (p) => (
  <svg {...base} {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="9" cy="10" r="2" />
    <path d="M21 16l-5-5-9 9" />
  </svg>
)
export const IconArrowDown = (p) => (
  <svg {...base} {...p}>
    <path d="M12 5v14M6 13l6 6 6-6" />
  </svg>
)

// Logo oficial de WhatsApp (glifo), en su verde.
export const IconWhatsApp = ({ className = '', ...p }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" className={className} {...p}>
    <path
      fill="currentColor"
      d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.88-.79-1.48-1.76-1.66-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35ZM12.05 21.5h-.01a9.45 9.45 0 0 1-4.82-1.32l-.35-.2-3.58.94.96-3.49-.23-.36a9.43 9.43 0 0 1-1.45-5.03c0-5.22 4.25-9.47 9.48-9.47a9.4 9.4 0 0 1 6.7 2.78 9.4 9.4 0 0 1 2.77 6.7c0 5.23-4.25 9.48-9.47 9.48Zm8.06-17.54A11.33 11.33 0 0 0 12.05.63C5.77.63.66 5.74.66 12.02c0 2 .53 3.97 1.52 5.7L.56 23.63l6.04-1.58a11.37 11.37 0 0 0 5.44 1.39h.01c6.28 0 11.39-5.11 11.39-11.4 0-3.04-1.18-5.9-3.33-8.05Z"
    />
  </svg>
)
