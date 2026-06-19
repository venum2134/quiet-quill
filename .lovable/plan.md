# Sidebar pixel-perfect — clone ChatGPT

Objectif : aligner `src/components/Sidebar.tsx` au pixel près sur la sidebar ChatGPT de la capture (mode clair + sombre).

## Spécifications visuelles exactes

### Conteneur
- Largeur étendue : **260px** (inchangé)
- Background : `#f9f9f9` (light) / `#171717` (dark) — token `--c-sidebar-bg` dédié (différent de `--c-bg` du chat)
- Pas de bordure droite visible (ChatGPT n'en a pas, juste un décalage de couleur)
- Padding global : **8px** horizontal

### Header (logo + collapse)
- Hauteur : **44px**
- Logo Obsidian 24×24 à gauche, padding-left 10px
- Icône collapse `PanelLeftClose` 20px stroke 1.5 à droite, bouton 32×32, hover `rgba(0,0,0,0.05)` / `rgba(255,255,255,0.05)`
- Pas de label "obsidian" textuel à côté du logo (ChatGPT n'affiche que l'icône) — OU garder le wordmark en 14px/600 selon préférence

### Nav rows (New chat / Search / Diagnostic)
- Hauteur : **36px** (inchangé)
- Padding interne : **10px** horizontal
- Border-radius : **8px**
- Gap icône↔label : **10px**
- Icônes : **20px**, stroke **1.5** (actuellement 16/1.7 → trop fin)
- Label : **14px**, font-weight **400** (pas 500 — ChatGPT est régulier), letter-spacing **-0.01em**
- Hover : `rgba(0,0,0,0.05)` / `rgba(255,255,255,0.05)` — token `--c-sidebar-hover`
- Raccourci `⌘K` : 11px, color muted, padding 2px 6px, pas de bordure
- Badge `NEW` : retirer (ChatGPT n'en a pas) OU 10px/600 uppercase si conservé

### Section labels (Today / Yesterday / Previous 7 days…)
- Font-size : **12px**
- Font-weight : **600** (actuellement 500)
- Color : `--c-muted-fg` plus contrasté (~`#8e8ea0`)
- Padding : **16px 10px 6px** (plus d'espace au-dessus)
- Texte : "Today", "Yesterday", "Previous 7 days", "Previous 30 days" (anglais, casse Title Case)

### Thread rows
- Hauteur : **36px** (actuellement 30 — trop dense)
- Padding : **0 10px**
- Border-radius : **8px**
- Font-size : **14px** (actuellement 13)
- Font-weight : **400** toujours (même actif — ChatGPT ne bolde pas)
- Color : `--c-fg` (pas muted)
- Letter-spacing : **-0.01em**
- État actif : background `rgba(0,0,0,0.06)` / `rgba(255,255,255,0.08)` — token `--c-sidebar-active`
- Hover : `--c-sidebar-hover`
- Truncate avec ellipsis
- Bouton `MoreHorizontal` : 24×24, icône 16px, visible uniquement au hover/actif, padding-right 4px

### Footer (UserMenu)
- Hauteur : **52px** (actuellement 40)
- Pas de `border-top` (ChatGPT n'en a pas)
- Avatar : **28×28** (actuellement 24)
- Nom : 14px/500
- Sous-label "Free plan" : retirer (ChatGPT affiche juste le nom) ou garder 12px muted

### Collapsed (60px)
- Boutons 36×36, icônes 20px stroke 1.5
- Gap : 4px

## Nouveaux tokens CSS (src/styles.css)

```css
:root {
  --c-sidebar-bg: #f9f9f9;
  --c-sidebar-hover: rgba(0,0,0,0.05);
  --c-sidebar-active: rgba(0,0,0,0.06);
}
[data-theme="dark"] {
  --c-sidebar-bg: #171717;
  --c-sidebar-hover: rgba(255,255,255,0.05);
  --c-sidebar-active: rgba(255,255,255,0.08);
}
```

## Fichiers touchés
- `src/styles.css` — ajout des 3 tokens sidebar
- `src/components/Sidebar.tsx` — application des valeurs ci-dessus (header, nav, SearchRow, SectionLabel, ThreadRow, UserMenu, version collapsed)

## Décisions à confirmer
1. **Wordmark "obsidian"** à côté du logo : garder ou retirer (ChatGPT ne montre que l'icône) ?
2. **Badge `NEW`** sur Diagnostic : garder ou retirer ?
3. **Sous-label "Free plan"** : garder ou retirer ?
4. **Langue des section labels** : anglais ("Today", "Yesterday"…) comme ChatGPT, ou français ?

Réponds par défaut "tout retirer + anglais" si tu veux l'aspect ChatGPT pur, sinon précise.
