// FIT (Frontier Institute of Technology) — Global Skills Academy
// Brand theme for the "AI Fluency for the Workplace" PeerFinder
//
// Structure mirrors ALX's theme.js (colors.primary.x / colors.secondary.x / fonts.main)
// so every page component that does `import { colors, fonts } from '../theme'` keeps working
// unchanged at the import level — only the values differ.
//
// Mapping notes (ALX role → FIT role):
//   primary.berkeleyBlue (dark bg/header)      → FIT --color-primary   (#103049)
//   primary.iris         (primary CTA buttons) → FIT --color-tertiary  (#4278EC)
//   primary.springGreen  (progress/success)    → FIT --color-accent    (#49B318)
//   primary.white        (cards/light bg)      → FIT --color-light     (#FFFFFF)
//   secondary.electricBlue (focus/outline)     → FIT --color-tertiary  (#4278EC)
//   secondary.gold       (badges/highlights)   → FIT --color-secondary (#B4E000)
//   secondary.tomato     (destructive/errors)  → custom brand-safe red (#E5484D) — FIT has no red in
//                                                 its palette, so this is a curated addition chosen to
//                                                 sit comfortably alongside --color-primary and stay
//                                                 accessible on white and dark backgrounds.

export const colors = {
  primary: {
    berkeleyBlue: '#103049',   // --color-primary
    iris: '#4278EC',           // --color-tertiary (primary CTA blue)
    springGreen: '#49B318',    // --color-accent (success / progress fill)
    white: '#FFFFFF',          // --color-light
  },
  secondary: {
    electricBlue: '#4278EC',   // --color-tertiary (focus rings, links, outlines)
    gold: '#B4E000',           // --color-secondary (badges, highlights, capacity bars)
    tomato: '#E5484D',         // curated danger red (ghosting flags, unpair, errors)
  },

  // Full FIT palette — available for the batch-2 page redesigns
  raw: {
    light: '#FFFFFF',
    primary: '#103049',
    secondary: '#B4E000',
    tertiary: '#4278EC',
    accent: '#49B318',

    primaryHover: '#40596D',
    secondaryHover: '#C3E633',
    tertiaryHover: '#6893F0',
    accentHover: '#6DC246',

    primary40: '#708392',
    primary60: '#9FACB6',
    primary80: '#CFD6DB',

    secondary40: '#D2EC66',
    secondary60: '#E1F399',
    secondary80: '#F0F9CC',

    tertiaryDarker: '#28488E',
    tertiary40: '#8EAEF4',
    tertiary60: '#B3C9F7',
    tertiary80: '#D9E4FB',

    accent40: '#92D174',
    accent60: '#B6E1A3',
    accent80: '#DBF0D1',

    lightBackground: '#CFD6DB',
  }
};

export const fonts = {
  main: "'Lexend', sans-serif",
};

// Add this to the <head> of index.html (or wherever ALX's PeerFinder loads its font)
// so 'Lexend' actually resolves instead of silently falling back to sans-serif:
//
// <link rel="preconnect" href="https://fonts.googleapis.com">
// <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
// <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
