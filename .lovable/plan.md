# Mode sombre style ChatGPT

Ajouter un thème sombre inspiré de ChatGPT (fond ~#212121, sidebar ~#171717, texte clair, bulles user ~#2f2f2f) avec un toggle persistant dans la sidebar.

## Palette cible (dark)

- `--color-background` : `#212121` (zone chat principale)
- `--color-sidebar` : `#171717` (sidebar)
- `--color-surface` (bulles user, cards, input) : `#2f2f2f`
- `--color-surface-hover` : `#3a3a3a`
- `--color-foreground` (texte principal) : `#ececec`
- `--color-muted-foreground` (texte secondaire) : `#9b9b9b`
- `--color-hairline` (bordures) : `#3a3a3a`
- Bouton submit clair sur fond sombre : `#ffffff` / icône `#000`

Mode clair = palette actuelle (cream/ink) inchangée.

## Travail à faire

### 1. `src/styles.css`
- Déplacer **toutes** les couleurs (cream, ink, soft, smoke, ash, hairline, hairline-strong, surface user-bubble `#f1efea`, hover `#f4f1ec`, code bg `#1a1a1a`/`#27251e`, etc.) dans des variables CSS sur `:root`.
- Ajouter un bloc `html.dark { ... }` qui remappe ces mêmes variables vers la palette ChatGPT ci-dessus.
- Mettre à jour les classes `.pplx-card:hover`, `.pplx-nav:hover`, `.pplx-submit:hover`, `.pplx-input-wrap:focus-within`, `.pplx-shimmer`, `.pplx-caret::after`, scrollbar sidebar — qui contiennent aujourd'hui des hex codés en dur — pour utiliser ces variables.

### 2. Composants (`ChatView.tsx`, `DiagnosticFlow.tsx`, `Sidebar.tsx`, routes `index.tsx`, `$threadId.tsx`, `diagnostic.tsx`)
- Remplacer chaque hex inline (`#faf8f5`, `#27251e`, `#f1efea`, `#ece9e2`, `#d4d2cc`, `#92918b`, `#72706b`, `#000`, `#1a1a1a`, `#f4f1ec`, gradients `linear-gradient(... #faf8f5 ...)`) par `var(--color-…)`.
- Les bulles "diagnostic" colorées (vert `#eef3ee`, beige `#faf3ee`) auront leurs propres variables (`--color-success-bg/border`, `--color-warning-bg/border`) avec équivalents sombres.

### 3. Toggle thème
- Nouveau hook `src/hooks/useTheme.ts` : lit/écrit `localStorage["theme"]` (`light` | `dark`), applique/retire la classe `dark` sur `document.documentElement`, init au mount (avec fallback `prefers-color-scheme`).
- Bouton dans `Sidebar.tsx` (en bas, près du profil utilisateur) : icône `Sun`/`Moon` de `lucide-react`, label "Mode sombre"/"Mode clair", style cohérent avec les autres `pplx-side-item`.
- Appliquer le thème côté `__root.tsx` via un petit script inline dans `<head>` pour éviter le flash blanc au chargement (lit `localStorage` avant le rendu).

## Hors scope

- Pas de changement de logique métier (diagnostic, chat, IA).
- Pas de refonte visuelle : seules les couleurs basculent ; typographies, espacements, rayons, animations restent identiques.
