// FIT (Frontier Institute of Technology) — Global Skills Academy
// Theme for the "AI Fluency for the Workplace" PeerFinder
//
// ── Architecture ────────────────────────────────────────────────────────────
// This follows the same semantic-token system used in ALX ProConnect rather
// than naming colours after what they look like. Tokens are named for the JOB
// they do, so a palette change never leaves you with a variable called
// "springGreen" that is actually blue.
//
//   surface.*   layered dark "ink" backgrounds, lowest → highest elevation
//   line.*      borders and dividers
//   text.*      foreground hierarchy (hi = primary, lo = secondary, mute = tertiary)
//   accent.*    brand accents. Each has a base and a `Hi` variant:
//                 base  → the true brand hex; use on dark surfaces and as a
//                         solid button background paired with dark text
//                 Hi    → lightened same-hue tone; use for text, icons, thin
//                         borders and focus rings on dark surfaces, where the
//                         base tone would not clear contrast minimums
//
// ── Brand source of truth ───────────────────────────────────────────────────
// Derived from FIT's official brand CSS. Note the role assignments, which
// differ from the earlier draft palette:
//   --color-primary   #103049  navy   → the ink ramp below is built from this
//   --color-secondary #4278EC  blue   → accent.azure (primary CTA)
//   --color-tertiary  #B4E000  lime   → accent.lime  (success / progress)
//   --color-accent    #DF8CBB  pink   → accent.rose  (highlights / attention)
//   --font-family     'DM Sans'
//
// FIT's palette contains no red, so `accent.danger` is a curated addition for
// destructive actions (unpair, ghosting reports, errors). It is tuned to sit
// comfortably beside the navy ink ramp and to stay legible on dark surfaces.

const ink = {
  base: '#0A1F30',   // page canvas — one step darker than brand navy
  raised: '#103049', // --color-primary. cards, panels, navbar
  high: '#17435F',   // hover / nested panels / elevated rows
  line: '#21536F',   // borders, dividers
  lineSoft: '#1A3A52',
};

export const colors = {
  // ── Surfaces ──────────────────────────────────────────────────────────────
  surface: {
    base: ink.base,
    raised: ink.raised,
    high: ink.high,
    // Translucent overlays for glass panels and modal scrims
    glass: 'rgba(16, 48, 73, 0.72)',
    scrim: 'rgba(10, 31, 48, 0.82)',
    // Light "paper" surfaces, kept for the rare light-on-dark inversion
    paper: '#FFFFFF',
    paper2: '#CFD6DB', // --color-light-background
  },

  line: {
    base: ink.line,
    soft: ink.lineSoft,
    paper: '#CFD6DB',
  },

  // ── Text ──────────────────────────────────────────────────────────────────
  text: {
    hi: '#F1F5F7',      // headings, primary copy on dark
    lo: '#9FACB6',      // --color-primary-60. secondary copy, labels
    mute: '#708392',    // --color-primary-40. meta, placeholders, disabled
    onAccent: '#0A1F30',// dark text placed on lime / rose / bright buttons
    ink: '#103049',     // primary copy on paper surfaces
    inkLo: '#40596D',   // --color-primary-hover. secondary copy on paper
  },

  // ── Accents ───────────────────────────────────────────────────────────────
  accent: {
    // Primary action colour — buttons, links, active states
    azure: '#4278EC',       // --color-secondary
    azureHi: '#8EAEF4',     // --color-secondary-40
    azureHover: '#6893F0',  // --color-secondary-hover
    azureSoft: 'rgba(66, 120, 236, 0.14)',

    // Success, capacity bars, positive status
    lime: '#B4E000',        // --color-tertiary
    limeHi: '#D2EC66',      // --color-tertiary-40
    limeHover: '#C3E633',   // --color-tertiary-hover
    limeSoft: 'rgba(180, 224, 0, 0.14)',

    // Highlights, badges, "needs attention" without being an error
    rose: '#DF8CBB',        // --color-accent
    roseHi: '#E5A3C9',      // --color-accent-40
    roseSoft: 'rgba(223, 140, 187, 0.14)',

    // Destructive / error — curated, not part of FIT's published palette
    danger: '#E5484D',
    dangerHi: '#FF8A8E',
    dangerSoft: 'rgba(229, 72, 77, 0.14)',
  },

  // ── Effects ───────────────────────────────────────────────────────────────
  shadow: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.30)',
    md: '0 4px 16px rgba(0, 0, 0, 0.34)',
    lg: '0 16px 48px rgba(0, 0, 0, 0.44)',
    glow: '0 0 0 1px rgba(66, 120, 236, 0.30), 0 8px 28px rgba(66, 120, 236, 0.18)',
  },

  radius: { sm: '6px', md: '10px', lg: '16px', pill: '999px' },

  // ── Legacy aliases ────────────────────────────────────────────────────────
  // The page components were originally written against ALX's colour names.
  // These keep any not-yet-converted file rendering sensibly on the dark
  // theme instead of crashing on an undefined key. Prefer the semantic tokens
  // above in all new and rewritten code.
  primary: {
    berkeleyBlue: ink.base,
    iris: '#4278EC',
    springGreen: '#B4E000',
    white: '#F1F5F7',
  },
  secondary: {
    electricBlue: '#8EAEF4',
    gold: '#B4E000',
    tomato: '#E5484D',
  },
};

export const fonts = {
  main: "'DM Sans', ui-sans-serif, system-ui, sans-serif",
  mono: "ui-monospace, 'SF Mono', Menlo, monospace",
};

// Shared building blocks so each page does not re-invent the same card,
// input and button treatments. Spread these, then override as needed:
//   style={{ ...ui.card, padding: '32px' }}
export const ui = {
  page: {
    minHeight: '100vh',
    background: colors.surface.base,
    color: colors.text.hi,
    fontFamily: fonts.main,
  },
  card: {
    background: colors.surface.raised,
    border: `1px solid ${colors.line.soft}`,
    borderRadius: colors.radius.lg,
    boxShadow: colors.shadow.md,
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    background: colors.surface.base,
    border: `1px solid ${colors.line.base}`,
    borderRadius: colors.radius.md,
    color: colors.text.hi,
    fontFamily: fonts.main,
    fontSize: '1rem',
    outline: 'none',
    boxSizing: 'border-box',
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontSize: '0.82rem',
    fontWeight: 600,
    letterSpacing: '0.02em',
    color: colors.text.lo,
  },
  btnPrimary: {
    background: colors.accent.azure,
    color: '#FFFFFF',
    border: 'none',
    borderRadius: colors.radius.pill,
    padding: '14px 28px',
    fontFamily: fonts.main,
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.18s ease, transform 0.18s ease',
  },
  btnGhost: {
    background: 'transparent',
    color: colors.text.lo,
    border: `1px solid ${colors.line.base}`,
    borderRadius: colors.radius.pill,
    padding: '10px 20px',
    fontFamily: fonts.main,
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'border-color 0.18s ease, color 0.18s ease',
  },
  badge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: colors.radius.pill,
    fontSize: '0.75rem',
    fontWeight: 600,
    letterSpacing: '0.03em',
  },
};

// DM Sans is loaded in index.html:
// <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap" rel="stylesheet">
