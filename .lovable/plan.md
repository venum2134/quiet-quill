# Toggle thème en haut + sidebar style ChatGPT

Deux changements coordonnés : déplacer le switch de thème dans une barre supérieure (visible en permanence), et resserrer la sidebar pour qu'elle ressemble à celle de ChatGPT (densité, typo, hiérarchie).

## 1. Barre supérieure (top header)

Nouvelle barre fine au-dessus du contenu principal (chat + diagnostic), à droite de la sidebar.

- Hauteur 48 px, fond `var(--c-bg)`, bordure basse `1px solid var(--c-border)`, padding horizontal 16 px.
- À gauche : titre contextuel (`Obsidian` sur l'accueil, titre du thread sur `/$threadId`, `Diagnostic` sur `/diagnostic`) — 14 px, semibold, `var(--c-fg)`.
- À droite : bouton toggle thème (icône `Sun`/`Moon` Lucide, 16 px, bouton rond 32×32, hover `var(--c-surface)`), avec `title` "Mode clair"/"Mode sombre".
- Composant `TopBar` réutilisable monté dans `ChatView` et `DiagnosticFlow` (et la home `index.tsx`).
- Retrait du toggle thème du `UserMenu` et de la version compacte de la sidebar (devient redondant).

Le hook `useTheme` reste tel quel ; seule la position de l'UI change.

## 2. Sidebar style ChatGPT

Resserrer la sidebar (cf. capture) — moins de bordures, plus de densité, typo plus marquée.

### Largeur + structure
- Largeur étendue : `260 px` (au lieu de 264) — détail.
- Padding interne uniformisé : `8 px` horizontal sur toute la hauteur.

### En-tête (logo + collapse)
- Hauteur 48 px (au lieu de 52).
- Logo `◆` carré 28×28 + libellé `obsidian` 14 px / semibold (déjà OK).
- Bouton collapse à droite, 28×28, icône 16, hover `var(--c-surface)`.

### Bloc de navigation (style ChatGPT)
Remplacer le gros bouton bordé "New Thread" + l'input de recherche autonome par **trois lignes nav identiques** (comme "New chat", "Search chats", "Library" chez ChatGPT) :

```
[icon] New chat          ⌘K
[icon] Search chats
[icon] Diagnostic        NEW
```

- Chaque ligne : hauteur 36 px, padding `0 8px`, gap icône/texte 10 px, font-size 14 px, weight 500, `border-radius 8px`, hover `var(--c-surface)`.
- Icônes 16 px, stroke 1.7, alignées verticalement.
- "Search chats" ouvre la recherche : au clic, la ligne se transforme en input inline (même hauteur, même style) avec focus auto ; Escape ou blur la referme. Filtrage existant conservé.
- Raccourci `⌘K` rendu à droite en `pplx-kbd` uniquement sur "New chat".
- Badge `NEW` conservé sur Diagnostic, plus discret (10 px, padding 2/5, `border-radius 4px`).

### Liste des threads
- Label de section : "Chats" en bas de casse, 12 px, weight 500, color `var(--c-muted)`, padding `12px 8px 6px` (au lieu de l'actuel uppercase 11 px). Les sous-groupes par date (Today, Yesterday…) suivent le même style.
- Lignes thread : hauteur **32 px** (au lieu de 30 implicite + paddings variables), padding `0 8px`, font-size 14 px, weight 400, couleur `var(--c-fg)`.
- État actif : fond `var(--c-surface-strong)`, weight inchangé (pas de gras) — ChatGPT ne met pas en gras l'actif.
- Hover : fond `var(--c-surface)`.
- Icône Pin (si épinglé) : 10 px, marge droite 6 px.
- Bouton `MoreHorizontal` : visible au hover uniquement (déjà OK), 24×24, marge droite 4 px.

### Pied (user menu)
- Conservé tel quel mais hauteur réduite à 40 px, avatar 24×24, gap 10 px, séparateur supérieur `1px solid var(--c-border)` plus discret.
- Retrait du `MoreHorizontal` à droite (ChatGPT n'en a pas — on garde juste l'avatar + nom + plan, tout est cliquable pour ouvrir le menu).

### Sidebar compacte (collapsed)
- Largeur 60 px (au lieu de 56).
- Icônes 16 px, boutons 36×36, espacement vertical 4 px.
- Suppression du bouton thème compact (déplacé dans la TopBar).

## 3. Détails techniques

- Nouveau composant `src/components/TopBar.tsx` exporte `TopBar({ title }: { title: string })`.
- `ChatView` reçoit le titre du thread actif et le passe à `<TopBar>` ; `DiagnosticFlow` passe `"Diagnostic"` ; `index.tsx` passe `"Obsidian"`.
- Le padding `pl-[264px]` / `pl-[60px]` (selon collapsed) des routes reste géré comme aujourd'hui ; la TopBar est rendue à l'intérieur du conteneur principal, pas au-dessus de la sidebar.
- `Sidebar.tsx` : refactor structurel des blocs nav + threads + footer ; pas de changement de logique métier (création/suppression/épinglage/renommage/export inchangés).
- Aucune nouvelle dépendance.

## Hors scope

- Pas de changement du contenu du chat ni du diagnostic.
- Pas de refonte des couleurs (palette claire/sombre déjà en place).
- Pas de menu "Share / ⋯" type ChatGPT dans la TopBar (placeholder uniquement si demandé plus tard).
