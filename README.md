# Obsidian — Automated Pentest, Democratized

> *Une équipe d'agents IA de calibre mondial, à la portée de chaque équipe de sécurité.*

## Vision

Obsidian est une plateforme d'agents IA spécialisés en cybersécurité. L'objectif est de concevoir une équipe d'agents IA capable de rivaliser avec les meilleurs experts de la tech mondiale cumulant 30 ans d'expérience — mais rendus accessibles à toute entreprise, quelle que soit sa taille ou son budget sécurité.

### Pourquoi Obsidian ?

Les pentests professionnels coûtent des milliers d'euros, nécessitent des semaines de planification, et ne sont pas réalisables en continu. Les outils automatisés existants manquent de contexte métier, produisent des faux positifs massifs, et exigent une expertise humaine pour interpréter les résultats.

Obsidian brise cette barrière : un agent IA expert qui guide, explique, et agit — en continu, en français, avec une interface pensée pour la clarté.

---

## Architecture Mentale du Projet

### Deux modes d'interaction

| Mode | Description | Usage |
|------|-------------|-------|
| **Chat libre** | Conversation ouverte avec un agent expert cybersécurité | Questions, analyses, conseils, hardening, threat modeling |
| **Diagnostic guidé** | Flux sécurisé de vérification de propriété → scan | Audit automatisé d'un domaine avec consentement légal |

### Philosophie du design : "Papier & Encre"

Le design suit une direction éditoriale inspirée de Perplexity et Claude : un fond crème chaud (`#faf8f5`), une encre presque noire (`#27251e`), aucune teinte saturée. L'objectif est de créer un sentiment de calme, d'autorité intellectuelle, et de lisibilité maximale. L'opposé d'une interface SaaS bleue standard.

**Hiérarchie visuelle psychologique :**
- **Niveau 1 — Encre (`#27251e`)** : ce qui parle. Réponses de l'agent, titres, input actif.
- **Niveau 2 — Smoke (`#72706b`)** : ce qui accompagne. Meta-informations, timestamps, descriptions.
- **Niveau 3 — Ash (`#92918b`)** : ce qui structure sans parler. Labels de section, raccourcis clavier, placeholders.

La règle d'or : **un seul élément "ink" attire l'œil par zone**. Tout le reste recule. Le contraste vient du silence des autres éléments, pas de la saturation d'un seul.

---

## Comment l'IA est utilisée dans ce projet

### 1. Le moteur de conversation (Chat libre)

**Fichier :** `src/routes/api/chat.ts`

L'agent conversationnel est propulsé par le **Vercel AI SDK** (`ai`, `@ai-sdk/react`) et le **Lovable AI Gateway**.

**System prompt (expertise injectée) :**
```
Tu es Obsidian, un assistant IA expert en cybersécurité
(pentest, OWASP, CVE, durcissement, threat modeling).
Réponds en français par défaut, clairement et de manière actionnable.
Formate avec markdown : gras, listes, titres, blocs de code.
Cite les CVE/CWE pertinents. Sois direct et substantif.
```

Ce prompt fait deux choses critiques :
1. **Positionne l'agent** comme un expert cybersécurité, pas un généraliste.
2. **Contraint le format** pour une lisibilité optimale (markdown structuré, citations CVE, actionnable).

**Streaming en temps réel :** `streamText()` produit un flux de tokens directement dans l'interface. L'utilisateur lit la réponse au fur et à mesure de sa génération, ce qui réduit la perception de latence.

**Modèles disponibles :**
| Modèle | Rôle |
|--------|------|
| `google/gemini-3-flash-preview` | Rapide, défaut. Idéal pour la plupart des questions. |
| `google/gemini-3.1-pro-preview` | Raisonnement profond, analyses complexes. |
| `openai/gpt-5` | Polyvalent, multimodal texte + image. |
| `openai/gpt-5.4` | Raisonnement avancé, code, analyse. |

Tous supportent la vision (analyse d'image). Le choix du modèle se fait via le picker en haut du chat.

### 2. Le flux de diagnostic sécurisé (Guided flow)

**Fichier :** `src/components/DiagnosticFlow.tsx`

Ce n'est pas un chat libre. C'est une **machine à états conversationnelle** où l'IA guide l'utilisateur à travers un processus réglementé :

```
awaiting_url → awaiting_method → awaiting_verification → verified
    → awaiting_consent → scan_running → scan_complete
```

À chaque étape, l'agent affiche des composants spécifiques :
- **Texte** : explications pédagogiques
- **Method-picker** : choix entre DNS / Meta tag / Fichier
- **Verification** : instructions techniques + polling automatique
- **Consent** : formulaire de consentement légal
- **Scan-progress** : barre de progression + statut en temps réel
- **Success / Error** : résultat final

**Pourquoi un flux guidé ?** Parce qu'un scan de sécurité non autorisé est illégal. L'agent vérifie la propriété du domaine (via token) et collecte un consentement écrit avant tout scan. L'IA agit ici comme **gardien juridique et technique**.

### 3. Génération de titres de thread

**Fichier :** `src/lib/threads.ts` → `deriveTitle()`

L'IA ne génère pas les titres. Le code extrait les 7 premiers mots du premier message utilisateur pour nommer automatiquement le thread. C'est léger, instantané, et évite un appel LLM supplémentaire.

### 4. Stratégie de persistance (Intelligence à long terme)

**Fichier :** `src/lib/threads.ts`

Toutes les conversations sont persistées dans `localStorage`. Chaque thread garde son historique complet de messages (`UIMessage[]`). L'IA a donc accès à tout le contexte passé de la conversation en cours.

**Pourquoi pas de base de données (pour l'instant) ?** Parce que le projet est conçu pour démarrer instantanément, fonctionner offline, et respecter la vie privée de l'utilisateur. La DB viendra quand on ajoutera des fonctionnalités multi-utilisateurs.

---

## Stack technique

| Couche | Technologie | Rôle |
|--------|-------------|------|
| Framework | TanStack Start v1 | React full-stack avec SSR, routing file-based, server functions |
| Build | Vite 7 | Bundling, HMR |
| Styling | Tailwind CSS v4 | Utility-first, custom theme tokens |
| UI | shadcn/ui + Radix | Composants accessibles et composables |
| Animations | Framer Motion | Transitions fluides, springs, micro-interactions |
| AI | Vercel AI SDK | `streamText`, `useChat`, `convertToModelMessages` |
| Gateway | Lovable AI Gateway | Proxy unifié vers Gemini, GPT, etc. |
| Font | Inter Variable | Police unique, OpenType features activées |
| State (client) | localStorage | Threads, préférences, état diagnostic |
| Query | TanStack Query | Cache, invalidation, état serveur |

---

## Typographie & Design System

### Police unique : Inter Variable

```css
font-family: "Inter Variable", "Inter", ui-sans-serif, system-ui, ...;
font-size: 16px;
line-height: 1.5;
font-weight: 400;
letter-spacing: -0.011em;
font-feature-settings: "cv11", "ss01", "ss03", "cv02";
font-optical-sizing: auto;
font-synthesis: none;
```

**Features OpenType activées** (`cv11`, `ss01`, `ss03`, `cv02`) : alternate glyphs plus lisibles, chiffres proportionnels, virgule géminée française. Ces détails créent la sensation "premium" d'une typographie soignée.

### Échelle typographique

| Élément | Taille | Poids | Letter-spacing | Rôle |
|---------|--------|-------|----------------|------|
| H1 | 22px | 600 | -0.011em | Titres markdown |
| H2 | 18px | 600 | -0.011em | Sous-titres |
| H3 | 16px | 600 | -0.011em | Sections |
| Body | 16px | 400 | -0.011em | Texte principal |
| Code inline | 0.88em | 400 | 0 | Mono, fond soft |
| Code block | 13px | 400 | 0 | Mono, fond ink inversé |
| Label section | 11px | 500 | 0.06em | UPPERCASE, ash |
| Kbd | 11px | 500 | 0.02em | Raccourcis clavier |

### Tokens de couleur

| Token | Valeur | Usage |
|-------|--------|-------|
| `--color-ink` | `#27251e` | Texte principal, boutons sombres |
| `--color-cream` | `#faf8f5` | Fond global |
| `--color-soft` | `#f1efea` | Surfaces secondaires, hover sidebar |
| `--color-hairline` | `#ece9e2` | Bordures fines |
| `--color-hairline-strong` | `#d4d2cc` | Bordures hover |
| `--color-smoke` | `#72706b` | Texte secondaire |
| `--color-ash` | `#92918b` | Texte tertiaire, labels |

---

## Animations : la psychologie du mouvement

Toutes les animations utilisent **une seule courbe** maîtresse :
```js
cubic-bezier(0.16, 1, 0.3, 1)  // "ease-out-soft"
```
Cette courbe a une décélération très longue — la sensation est celle d'un papier qui se pose doucement sur une table, jamais d'un ressort mécanique.

### Springs Framer Motion

| Nom | Stiffness | Damping | Usage |
|-----|-----------|---------|-------|
| `springSoft` | 260 | 26 | Layout, sidebar, transitions de page |
| `springSnappy` | 420 | 32 | Hover, popIn, interactions rapides |

### Variants réutilisables (`src/lib/motion.ts`)

- **fadeIn** : opacity 0 → 1, 200ms
- **fadeInUp** : opacity 0 + y:8 → opacity 1 + y:0, 280ms (messages)
- **popIn** : scale 0.94 + opacity 0 → scale 1 + opacity 1 (menus, toasts)
- **staggerContainer** : delay 40ms, stagger 40ms entre enfants (listes, cartes)

### Micro-interactions

- **Hover** : `translateY(-2px)` sur les cartes, `scale(1.06)` sur le bouton submit
- **Tap** : `scale(0.96)` sur tous les boutons interactifs
- **Sidebar active** : `layoutId="active-thread-bg"` — le fond de sélection glisse physiquement entre les items
- **Caret streaming** : clignotement steps(1), 1.1s (pas un fade, un vrai blink de terminal)
- **Shimmer "Thinking..."** : dégradé qui balaie horizontalement sur le texte

### Transition entre routes

`AnimatePresence` autour de `<Outlet />` avec `key={pathname}` : crossfade subtil de 180ms. La page actuelle s'efface, la nouvelle apparaît — sans coupure visuelle.

---

## Structure des fichiers

```
src/
├── routes/
│   ├── __root.tsx           # Layout racine, providers, meta SEO, AnimatePresence
│   ├── index.tsx            # Redirection vers le premier thread
│   ├── $threadId.tsx        # Page de chat (sidebar + ChatView)
│   ├── diagnostic.tsx       # Page du flux de diagnostic
│   └── api/
│       └── chat.ts          # Endpoint server : streamText avec system prompt
├── components/
│   ├── ChatView.tsx         # Composant principal du chat (input, messages, modèle picker)
│   ├── Sidebar.tsx          # Sidebar avec threads, groupés par date, animé
│   └── DiagnosticFlow.tsx   # Machine à états conversationnelle du diagnostic
├── lib/
│   ├── motion.ts            # Presets Framer Motion (variants, springs, easing)
│   ├── models.ts            # Définition des modèles LLM disponibles
│   ├── threads.ts           # CRUD threads localStorage, export, titre auto
│   ├── preferences.ts       # localStorage : modèle choisi, sidebar collapsed, feedback
│   ├── diagnostic.ts        # State machine + persistence diagnostic
│   ├── ai-gateway.server.ts # Client Lovable AI Gateway (server-only)
│   ├── config.server.ts     # Configuration serveur (env vars)
│   └── utils.ts             # Helpers (cn, formatDate, etc.)
├── hooks/
│   └── use-mobile.tsx       # Détection breakpoint mobile
├── router.tsx               # Configuration TanStack Router
├── server.ts                # Entry point Worker (SSR error handling)
├── start.ts                 # Middleware global (error handling)
└── styles.css               # Design system complet (tokens, keyframes, markdown)
```

---

## Comment l'IA est structurée dans le code

### 1. Le contrat entre frontend et backend

**Frontend** (`ChatView.tsx`) → appelle `useChat` du Vercel AI SDK.
```ts
const { messages, input, handleSubmit, status } = useChat({
  api: "/api/chat",
  body: { model: selectedModelId },
});
```

**Backend** (`api/chat.ts`) → reçoit les messages, appelle `streamText()`.
```ts
const result = streamText({
  model: gateway(modelId),
  system: SYSTEM_PROMPT,
  messages: await convertToModelMessages(messages),
});
return result.toUIMessageStreamResponse({ originalMessages: messages });
```

Le `convertToModelMessages()` transforme les `UIMessage` (format UI-friendly) en `CoreMessage` (format LLM-native). Le SDK gère tout le protocole de streaming (SSE), la reconnexion, et le parsing.

### 2. Le rôle du system prompt

Le system prompt est **durci dans le code** (`api/chat.ts`, ligne 5-6). Ce n'est pas configurable par l'utilisateur. C'est une décision architecturale : l'identité d'Obsidian est fixe. L'agent est toujours un expert cybersécurité, toujours en français, toujours actionnable.

**Pourquoi pas de prompt éditable ?** Parce que la valeur du produit est dans la spécialisation. Un prompt généraliste dégraderait l'expérience.

### 3. Le state management

L'IA n'a pas de mémoire persistante côté serveur. Chaque requête contient l'historique complet de la conversation. C'est le pattern "stateless with client-side history" du Vercel AI SDK :

```
Client : envoie [msg1, msg2, msg3, newQuestion]
Server : reçoit tout l'historique → génère réponse → renvoie stream
Client : ajoute la réponse à son state local → persiste dans localStorage
```

Avantages : pas de session serveur à gérer, horizontalement scalable, respect de la vie privée.
Inconvénients : limite de contexte du modèle, pas de mémoire cross-conversation.

### 4. L'AI Gateway

**Fichier :** `src/lib/ai-gateway.server.ts`

Le Lovable AI Gateway est un proxy unifié vers plusieurs fournisseurs (OpenAI, Google, etc.). Il gère :
- **L'authentification** via `Lovable-API-Key`
- **Le tracking** via `X-Lovable-AIG-Run-ID` (pour le debugging côté Lovable)
- **Le streaming** transparent (pas de buffering, les tokens passent direct)

```ts
const gateway = createOpenAICompatible({
  name: "lovable",
  baseURL: "https://ai.gateway.lovable.dev/v1",
  headers: { "Lovable-API-Key": lovableApiKey },
});
```

Le modèle est sélectionné dynamiquement : `gateway(modelId)` où `modelId` vient du picker utilisateur (`google/gemini-3-flash-preview`, etc.).

---

## Roadmap stratégique (où on va)

### Court terme (maintenant)
- Chat expert cybersécurité avec 4 modèles
- Diagnostic guidé avec vérification de propriété
- Threads persistés en localStorage
- Interface éditoriale premium (Papier & Encre)

### Moyen terme
- Base de données (Lovable Cloud) pour persistance multi-device
- Authentification utilisateur
- Historique de scans avec rapports générés par IA
- Intégration d'outils réels (nmap, nuclei, OWASP ZAP) via server functions
- Mode "équipe d'agents" : plusieurs agents spécialisés (recon, exploit, reporting)

### Long terme (la vision)
- **Agent Reconnaissance** : cartographie automatique de surface d'attaque
- **Agent Exploitation** : identification et scoring des vulnérabilités
- **Agent Reporting** : génération de rapports PDF/Markdown exploitables
- **Agent Hardening** : recommandations de durcissement personnalisées
- **Agent Veille** : surveillance continue des CVE et threats

Chaque agent est un spécialiste. Ensemble, ils forment une équipe de pentest virtuelle de niveau senior — disponible 24/7, à un coût marginal.

---

## Développement local

```bash
# Installer les dépendances
bun install

# Lancer en dev
bun dev

# Build
bun run build

# Preview
bun run preview
```

**Prérequis :** une clé `LOVABLE_API_KEY` dans les variables d'environnement (Lovable Cloud / Secrets).

---

## Architecture de sécurité

- **Vérification de propriété obligatoire** avant tout scan (DNS / Meta / Fichier)
- **Consentement écrit collecté** avec texte légal explicite
- **Audit trail** persistant en localStorage (`obsidian:audit-trail`)
- **Pas de données serveur** : tout reste côté client (pour l'instant)
- **RLS à venir** quand la DB sera intégrée

---

## Crédits & inspirations

- **Perplexity** pour la philosophie "épuré éditorial" du chat
- **Claude (Anthropic)** pour l'expérience conversationnelle calme et autoritaire
- **Linear** pour les micro-interactions et les animations spring
- **Vercel AI SDK** pour l'abstraction élégante du streaming LLM
- **Lovable** pour la rapidité de prototypage et le gateway IA
