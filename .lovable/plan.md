# Plan — Animations premium avec Framer Motion

Objectif : ajouter des micro-animations subtiles et cohérentes (style Claude / Linear) sans casser l'UI actuelle. Rien d'extravagant, juste du polish partout où ça compte.

## Setup

- Installer `framer-motion` (`bun add framer-motion`).
- Créer `src/lib/motion.ts` avec des presets réutilisables :
  - `fadeInUp` (opacity + y:8 → 0, 0.25s ease-out)
  - `fadeIn` (0.2s)
  - `popIn` (scale 0.96 → 1 + opacity)
  - `staggerContainer` (delayChildren 0.04, staggerChildren 0.03)
  - transitions : `spring` doux (stiffness 260, damping 26) et `ease` (`[0.16, 1, 0.3, 1]`)
- Respect de `prefers-reduced-motion` via `useReducedMotion` → durations à 0.

## ChatView

- **Messages** : `AnimatePresence` + `motion.div` sur chaque bubble avec `fadeInUp`. Stagger léger sur le premier render d'un thread.
- **Streaming caret** : remplacer le `▍` CSS par un `motion.span` qui pulse (opacity 1↔0.3, 0.8s loop).
- **Shimmer "Thinking…"** : déjà présent → ajouter un `motion.div` qui fade-in à l'apparition.
- **Action bar (Copy / Regenerate / TTS / 👍👎)** : `AnimatePresence` au hover du message (`whileHover` parent), boutons en `fadeIn` + translate-y 4px.
- **Toast feedback** (copy, like) : petit `popIn` (déjà géré par shadcn `sonner`, on laisse).
- **Composer** :
  - Focus ring : `motion` sur le border avec `layout` transition.
  - Attachments chips : `AnimatePresence` `popIn` + exit `scale 0.9 + fade`.
  - Send button : `whileTap scale 0.94`, `whileHover scale 1.04`.
- **Slash command menu** : `AnimatePresence` `fadeInUp` (y:4) + stagger items.
- **Model picker popover** : `popIn` (déjà via Radix, on laisse — sinon override).
- **Empty state** : suggestions cards en `staggerContainer` à l'arrivée, `whileHover { y: -2 }`.

## Sidebar

- **Collapse/expand** : `motion.aside` avec `animate={{ width }}` + spring → transition fluide entre 56px et 280px (au lieu du `transition-all` CSS actuel).
- **Thread list** : `AnimatePresence` sur chaque thread (entry `fadeInUp`, exit `fade + height 0` quand delete → effet "slide out").
- **Pinned section** : `motion` height auto quand on pin/unpin (`layout` prop).
- **Active thread indicator** : `layoutId="activeThread"` sur la barre/fond actif → glissement entre threads.
- **New chat button** : `whileTap`, `whileHover` subtils.
- **Search input** : expand width au focus (optional, petit détail).

## Diagnostic flow

- **Step transitions** : `AnimatePresence mode="wait"` entre étapes, `fadeInUp`.
- **Progress bar** : `motion.div` avec `animate={{ width: '${pct}%' }}` + spring.
- **Method choice buttons** : stagger entry + `whileHover { scale: 1.02, y: -2 }`.
- **Polling status** : pulse dot animé (scale 1↔1.3, opacity loop).
- **Success check** : `popIn` avec spring bouncy quand token détecté.

## Page transitions (routes)

- Dans `__root.tsx` : wrapper `<AnimatePresence mode="wait">` autour de `<Outlet />` avec key = pathname → fade subtil (0.15s) entre pages.

## Détails globaux

- **Buttons** (variant primary) : ajouter `whileTap={{ scale: 0.97 }}` via un wrapper `MotionButton` ou directement.
- **Popovers / dropdowns** : Radix gère déjà via `data-state`; on ajoute juste des keyframes CSS `scale-in` + `fade-in` dans `styles.css` si pas déjà là.
- **Toaster (sonner)** : laisser tel quel.

## Fichiers

- **Créés** : `src/lib/motion.ts`
- **Édités** : `src/components/ChatView.tsx`, `src/components/Sidebar.tsx`, `src/components/DiagnosticFlow.tsx`, `src/routes/__root.tsx`, `src/styles.css` (keyframes d'appoint), `package.json` (`framer-motion`).

## Hors scope

- Pas de refonte visuelle, pas de nouvelles features, pas de page Settings.
- Pas d'animations lourdes (Lottie, 3D, parallax).
- Pas de changement de logique métier.
