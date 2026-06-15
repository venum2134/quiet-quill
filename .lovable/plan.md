Anatomie réelle de la sidebar Claude/ChatGPT — c'est ce qui manque actuellement.

## Ce qui les rend reconnaissables

1. **Densité serrée** : items à 32–34px de hauteur (pas 40), texte 13–14px, padding horizontal 8–10px → beaucoup plus d'air vertical.
2. **Header sticky** avec logo + bouton "New chat" full-width juste en dessous (l'action principale, toujours visible).
3. **Section "Chats" / "History"** avec titre minuscule en uppercase tracking large (`12px`, `font-weight: 500`, `letter-spacing: 0.04em`, couleur smoke) — c'est LA signature visuelle.
4. **Historique groupé par date** : "Today", "Yesterday", "Previous 7 days", "Previous 30 days" — chaque groupe a son micro-titre.
5. **Items historique** : juste du texte tronqué (`text-overflow: ellipsis`, `white-space: nowrap`), pas d'icône, hover background `#f1efea`, action menu `⋯` qui apparaît seulement au hover.
6. **Footer utilisateur** sticky en bas : avatar rond + nom + plan ("Free") + `⋯`. Sépare nettement la session du contenu.
7. **Scroll interne** : seule la zone historique scrolle, header et footer restent fixes.

## Typographie spécifique

- **Items nav principaux** : `13px`, `font-weight: 500`, `letter-spacing: -0.006em`, line-height 1
- **Titres de section** ("Chats", "Today") : `11px`, `font-weight: 500`, `letter-spacing: 0.04em`, `text-transform: uppercase`, couleur `#92918b`
- **Items historique** : `13px`, `font-weight: 400`, couleur `#27251e`, tronqué
- **Footer user** : nom `13px / 500`, plan `12px / 400 / #72706b`
- **Bouton New chat** : `13px / 500`

→ La hiérarchie repose sur **weight + uppercase**, pas sur la taille.

## Composants à ajouter

1. **Header sticky** (top, non-scrollable)
   - Logo dot + "perplexity" en wordmark 14px
   - Bouton collapse `⇤` à droite (icône `PanelLeftClose`)

2. **Bouton "New Thread"** full-width juste sous le header
   - 32px de haut, bordure 1px `#ece9e2`, radius 8px, icône `+` à gauche, raccourci `⌘K` à droite en `#92918b 11px`
   - Style identique à ChatGPT "New chat"

3. **Search compact** (déjà là, à affiner)
   - Pas de fond visible par défaut, juste l'icône + placeholder, fond au focus

4. **Nav principale** (Discover, Spaces, Library) — section sans titre, items 32px

5. **Section "CHATS"** (titre uppercase)
   - Sous-groupes par date avec mini-titres "Today", "Yesterday"
   - 6–8 threads exemples ("Quantum computing basics", "React 19 use() hook", "Trip to Lisbon", "TypeScript generics", "Climate report 2024", etc.)
   - Hover : background + `⋯` qui fade-in à droite

6. **Footer user sticky** (bottom)
   - Séparateur `1px #ece9e2` au-dessus
   - Avatar 24px rond avec initiale, nom "Antoine", sous-texte "Free plan", icône `⋯` à droite
   - Hover : background `#f1efea`

## Layout

```
┌─────────────────────┐
│ ● perplexity     ⇤  │  ← header sticky (52px)
├─────────────────────┤
│ + New Thread   ⌘K   │  ← bouton primaire (40px)
│ 🔍 Search           │  ← search (36px)
├─────────────────────┤  
│  Discover           │  ← nav principale (sans titre)
│  Spaces             │
│  Library            │
│                     │
│  CHATS              │  ← titre uppercase
│  ─ Today ─          │
│  Quantum computing  │  ← scroll zone
│  React 19 hooks     │
│  ─ Yesterday ─      │
│  Trip to Lisbon     │
│  ...                │
├─────────────────────┤
│ ⓐ Antoine     ⋯     │  ← footer sticky (52px)
│   Free plan         │
└─────────────────────┘
```

## Détails techniques

- Largeur sidebar : passer à 264px (standard Claude)
- Padding interne : 8px horizontal, items à 8px padding interne (= 16px d'inset visuel via le padding du conteneur + de l'item)
- `flex` column avec header/footer `shrink-0` et zone middle `flex-1 overflow-y-auto`
- Scrollbar custom fine : `width: 6px`, thumb `#d4d2cc`, transparente au repos, visible au hover de la sidebar
- Tooltip raccourci `⌘K` sur "New Thread" (composant Tooltip shadcn déjà installé)
- Action `⋯` sur items historique : `opacity-0 group-hover:opacity-100` avec transition 150ms
- Aucune ombre, aucune bordure verticale séparant sidebar/main (règle Perplexity respectée)
- Inter Variable déjà chargé → on en profite avec font-features pour les chiffres tabulaires sur raccourcis (`font-variant-numeric: tabular-nums`)

Résultat : densité + hiérarchie typo claire + zones sticky = sensation Claude/ChatGPT immédiate.
