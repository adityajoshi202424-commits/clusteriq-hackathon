# Project Standards & Engineering Guidelines

These rules apply strictly across all design, frontend, copy, and backend code in this repository.

## 1. Visual & UI Design Constraints
- **No Purple Gradients**: Do not use purple gradients, violet glows, or neon aesthetic meshes. Use executive dark slate, deep navy, neutral titanium, and clean functional status accents (emerald, amber, rose).
- **No Pill-Shaped Buttons**: Never use full capsule/pill radii (`border-radius: 9999px` or similar). Use crisp, professional borders with standard geometric radii (`4px` to `8px`).
- **No Emoji Icons**: Do not use emojis (e.g., 🏔️, ⚡, 🏨, 🏛️, ⚠️, ⏱️) as interface icons, button decorators, or header accents. Use clean inline SVGs or concise typographic indicators.
- **No Over-the-Top Scroll Animations**: Avoid parallax bloat, tilt cards, float keyframes, and scroll-triggered spectacle. Interfaces must be fast, stable, and responsive.
- **No Cursor Animations**: No custom trailing cursors, magnetic cursor halos, or pointer effects.

## 2. Copy & Content Integrity
- **No Em Dashes**: Never use the em dash (`—`). Use standard hyphens (`-`), colons, or parentheses.
- **No Vague Hero Texts**: Copy must be domain-specific, concrete, and clear. Avoid hyperbolic hype ("Supercharge your workflow", "The ultimate AI revolutionized platform").
- **No AI-Slop Copy or Photos**: No generic generated filler imagery or buzzword soup. Keep technical descriptions grounded in real architecture.
- **No Fake Metrics, Fake Reviews, or Customer Counters**: Every metric must map to actual backend calculations, real pipeline outputs, or verified benchmarks. Never insert artificial social proof, fake review quotes, or animated counter tricks.

## 3. Production & Launch Requirements
Before any release or production deployment:
1. **Custom Domain**: Properly configured and connected.
2. **Favicon**: Proper favicon (`favicon.svg` / `favicon.ico`) linked in all HTML headers.
3. **Zero "Made with AI" Badges**: Ensure no AI generator watermarks, tags, or badges exist.
4. **Legal Pages**: Both a `/privacy` (Privacy Policy) and `/terms` (Terms & Conditions) page must be present and linked.
