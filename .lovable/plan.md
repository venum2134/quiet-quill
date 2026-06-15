# Plan — Obsidian UI upgrade (P1 + P2)

Objectif : éliminer tous les boutons décoratifs et amener le chat au niveau Claude/ChatGPT/Perplexity. Tout reste 100% frontend (localStorage), design beige actuel préservé. Aucune nouvelle dépendance backend.

---

## P1 — Tuer les boutons morts

### 1.1 Sélecteur de modèle réel (composer)
- Remplacer le pill `Gemini 3 Flash ▾` statique par un **vrai dropdown** (Popover shadcn) avec 4 modèles via l'AI Gateway :
  - `google/gemini-3-flash-preview` — "Rapide · défaut"
  - `google/gemini-3-pro-preview` — "Raisonnement profond"
  - `anthropic/claude-sonnet-4.5` — "Analyse experte"
  - `openai/gpt-5` — "Polyvalent"
- Stocké dans `localStorage` (`obsidian:model`), envoyé via `body` du `useChat` transport.
- API route `/api/chat` lit `model` du body au lieu du hardcode.
- Chaque entrée du menu : nom + 1 ligne de description + checkmark sur le sélectionné.

### 1.2 Menu user (bas sidebar)
- Popover sur le bouton profil "Antoine / Free plan" :
  - Settings (ouvre `/settings`)
  - Keyboard shortcuts (ouvre modale `⌘/`)
  - Effacer toutes les conversations (avec confirm)
  - Export JSON de tous les threads
- Pseudo + plan éditables dans `/settings` (localStorage `obsidian:user`).

### 1.3 Menu 3-dots par thread (sidebar)
- Remplacer le `Trash2` direct par un `MoreHorizontal` qui ouvre un Popover :
  - Renommer (inline edit du titre)
  - Pin / Unpin (nouvelle section "Pinned" en haut de la liste)
  - Exporter (Markdown)
  - Supprimer (avec confirm toast)
- Hover-only sur desktop, toujours visible si actif.

### 1.4 Toggle sidebar fonctionnel
- Bouton `PanelLeftClose` → collapse à 56px (icônes only).
- État dans `localStorage` (`obsidian:sidebar`).
- En collapsed : logo, New, Diagnostic, profil restent visibles en icônes. Threads cachés. Raccourci `⌘\`.
- Quand collapsed, un mini bouton "expand" flotte sur le bord.

### 1.5 Items nav décoratifs
- Supprimer `Discover`, `Spaces`, `Library` du sidebar (pas de roadmap pour eux).
- Garder uniquement `Diagnostic`. Ajouter `Settings` en bas.

### 1.6 Bouton Mic + Computer
- Mic : retirer (pas de roadmap voice court terme), ou l'implémenter avec `webkitSpeechRecognition`. **Décision : retirer** pour éviter un faux feature.
- `Computer` pill : retirer (concept Anthropic computer-use non implémenté).

---

## P2 — Features chat premium

### 2.1 Barre d'actions sous chaque réponse assistant
Apparait au hover du message :
- **Copy** (copie le markdown brut → toast "Copié")
- **Regenerate** (rejoue le dernier user message, supprime la réponse actuelle)
- **Thumbs up / down** (stocké localement, `obsidian:feedback`)
- **Read aloud** (Web Speech API `speechSynthesis`)
- Footer discret : nom du modèle utilisé + durée de génération (timer entre `submitted` et `ready`)

### 2.2 Code blocks premium
Custom renderer dans `ReactMarkdown` :
- Header gris foncé avec langage détecté + bouton Copy
- Police mono, padding propre
- Couleurs syntaxe via `react-syntax-highlighter` (preset `oneDark` ou custom beige/dark)
- Indispensable pour cyber (nginx confs, headers, SQL, payloads)

### 2.3 Édition messages user
- Bouton "Edit" (icon `Pencil`) au hover des bulles user
- Au clic → textarea inline avec Save / Cancel
- Save → tronque les messages après celui-ci et regénère
- Géré via `setMessages` du hook `useChat`

### 2.4 Attachements
- Drag & drop sur le composer (zone visible avec overlay quand fichier survolé)
- Bouton `+` ouvre file picker (images, PDF)
- Preview en chips au-dessus du textarea (thumbnail + nom + X)
- **MVP frontend-only** : images encodées base64 envoyées dans le `parts` du message (Gemini 3 Flash supporte vision via le Gateway)
- PDF : extraction texte côté client avec `pdfjs-dist`, injecté comme contexte texte

### 2.5 Slash commands
- Quand l'input commence par `/` → menu autocomplete flottant au-dessus du composer
- Commandes :
  - `/diagnostic` → navigate vers `/diagnostic`
  - `/cve <id>` → prompt template "Explique-moi la CVE-XXXX"
  - `/scan <url>` → idem que diagnostic mais pré-rempli
  - `/clear` → confirm + vide le thread courant
  - `/export` → télécharge le thread en .md
- Navigation flèches ↑↓, Enter pour valider, Esc pour fermer

### 2.6 Streaming polish
- Remplacer "Thinking…" plat par un vrai shimmer (texte animé gradient) avec messages variés selon durée (`Réflexion…` → `Analyse en cours…` → `Compilation des sources…`)
- Curseur clignotant `▍` qui suit le dernier caractère streamé (déjà partiellement via `.pplx-caret`)
- Esc pour stop (en plus du bouton)

---

## P3 — différé (mentionné pour info, pas implémenté maintenant)
- Settings page complète (theme, langue, modèle par défaut, reset)
- Modale raccourcis clavier (`⌘/`)
- Toasts globaux (sonner est probablement déjà dispo)
- Greeting horaire + "Continue last conversation" sur landing
- Citations/sources structurées
- Branches (re-generations multiples)
- Responsive mobile (sidebar drawer)

---

## Fichiers touchés

**Créés :**
- `src/components/ModelPicker.tsx`
- `src/components/MessageActions.tsx`
- `src/components/CodeBlock.tsx`
- `src/components/SlashCommands.tsx`
- `src/components/ThreadMenu.tsx` (3-dots par thread)
- `src/components/UserMenu.tsx` (popover profil)
- `src/components/AttachmentChips.tsx`
- `src/lib/models.ts` (catalogue modèles)
- `src/lib/preferences.ts` (localStorage prefs : model, sidebar, user)

**Édités :**
- `src/components/ChatView.tsx` (composer refait, message actions, slash commands, attachments)
- `src/components/Sidebar.tsx` (collapse, 3-dots, user menu, suppression nav décorative)
- `src/routes/api/chat.ts` (lit `model` du body)
- `src/styles.css` (styles code blocks, shimmer, animations menu)

**Dépendances ajoutées :**
- `react-syntax-highlighter` + `@types/react-syntax-highlighter`
- `pdfjs-dist` (extraction PDF côté client) — optionnel, peut être en P3 si trop lourd

---

## Hors scope explicite
- Auth / multi-user
- Backend persistance (toujours localStorage)
- Vraie computer-use Anthropic
- Voice input réel (mic retiré, pas implémenté)
- Mobile responsive (P3)
- Settings page (P3)

---

Validation prévue après build :
- Tous les boutons cliquables font quelque chose de visible
- Changement de modèle fonctionne (vérif via `/api/chat` qui reçoit bien le nouveau model)
- Copy / Regenerate / Edit OK sur un thread test
- Slash menu apparaît au `/`
- Collapse sidebar OK
