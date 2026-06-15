Rendre le chat fonctionnel : threads multiples, sauvegarde locale, Gemini 3 Flash via Lovable AI.

## Architecture

```
src/
├── routes/
│   ├── index.tsx           → redirige vers /:threadId (crée si vide)
│   ├── $threadId.tsx        → page de conversation (nouveau)
│   └── api/chat.ts          → endpoint streaming (nouveau)
├── lib/
│   ├── ai-gateway.server.ts → provider helper Lovable AI (nouveau)
│   └── threads.ts           → store localStorage des threads (nouveau)
└── components/
    ├── Sidebar.tsx          → extrait de index.tsx, liste les threads (nouveau)
    └── ChatView.tsx         → vue conversation avec messages + input (nouveau)
```

## Comportement utilisateur

1. **Premier accès `/`** : crée un thread vide, redirige vers `/{threadId}`
2. **Page d'accueil thread vide** : garde le grand wordmark "perplexity" + input central + cards de suggestions (état actuel)
3. **Envoi du premier message** : 
   - wordmark/cards disparaissent
   - layout bascule en mode conversation : messages en haut qui scrollent, input ancré en bas
   - réponse streamée token par token (markdown rendu)
4. **Sidebar** : liste les threads sauvegardés, click → navigue, "New Thread" → nouveau thread + nav, hover → bouton `⋯` pour supprimer/renommer
5. **Auto-titre** : après la 1re réponse, on prend les ~6 premiers mots du prompt utilisateur comme titre (pas d'appel IA pour ça, gratuit)
6. **Persistance** : tout dans `localStorage` clé `perplexity-threads`

## Backend — `src/routes/api/chat.ts`

Route serveur TanStack qui :
- Reçoit `{ messages: UIMessage[] }` en POST
- Lit `process.env.LOVABLE_API_KEY` 
- Appelle `streamText({ model: gateway("google/gemini-3-flash-preview"), messages, system })`
- System prompt : "You are Perplexity, a helpful AI assistant. Answer concisely with markdown formatting. Use lists, bold, and code blocks where helpful."
- Retourne `result.toUIMessageStreamResponse()`
- Gère 429 (rate limit) et 402 (crédits épuisés) avec messages clairs

## Frontend chat — `src/components/ChatView.tsx`

Utilise `useChat` de `@ai-sdk/react` avec :
- `id: threadId` (clé de remount entre threads)
- `messages: initialMessages` (chargés depuis localStorage)
- `transport: new DefaultChatTransport({ api: "/api/chat" })`
- `onFinish` : sauvegarde le tableau messages complet dans localStorage pour ce thread, et set le titre si c'est le 1er échange

**Deux états visuels** dans `ChatView` :
- `messages.length === 0` → état "landing" : wordmark + input centrés + cards suggestions
- `messages.length > 0` → état "conversation" : 
  - liste de messages scrollable (max-w 720px, centré)
  - user message : bulle alignée droite, fond `#f1efea`, radius 16px, padding 12/16
  - assistant message : pas de fond (règle chat-ui-composition), markdown rendu, padding vertical seul
  - indicateur "Thinking..." (shimmer) quand `status === "submitted"`
  - auto-scroll vers le bas
  - input reste ancré en bas (sticky), focus auto après envoi

Click sur une carte de suggestion → pré-remplit l'input et envoie.

## Store threads — `src/lib/threads.ts`

```ts
type Thread = { id: string; title: string; updatedAt: number; messages: UIMessage[] };

loadThreads(): Thread[]                          // depuis localStorage
saveThread(thread: Thread): void                 // upsert + tri par updatedAt
deleteThread(id: string): void
createThread(): Thread                           // id = crypto.randomUUID(), title = "New Thread"
getThread(id: string): Thread | null
groupByDate(threads): { Today, Yesterday, "Previous 7 days", "Older" }
```

Guard `typeof window !== "undefined"` partout. Toujours appelé depuis composants/effects, jamais au module scope.

## Sidebar refactor — `src/components/Sidebar.tsx`

Extrait propre de la sidebar actuelle. Différences :
- La liste "history" devient dynamique : `loadThreads()` + abonnement à un event custom `threads-updated` (dispatch après save/delete pour rafraîchir sans contexte global)
- Click sur item → `navigate({ to: "/$threadId", params: { threadId } })`
- Hover → `⋯` (PopoverMenu shadcn) avec "Rename" et "Delete"
- "New Thread" → `createThread()` puis navigate, raccourci `⌘K` branché via `useEffect` listener clavier
- Thread actif en surbrillance (`#ece9e2` background) via comparaison avec `useParams`

## Markdown rendering

Installer `react-markdown` + `remark-gfm` pour les messages assistant. Style :
- Pas de `prose` Tailwind (trop générique) → CSS scoppé minimal avec couleur `#27251e`, taille 16px, line-height 1.6
- `p` espacement 12px
- `ul/ol` indent 24px, gap 6px
- `code` inline : fond `#f1efea`, padding 2px 6px, radius 4px, font-mono
- `pre code` : fond `#27251e`, texte `#faf8f5`, padding 14px, radius 8px, overflow-x-auto, font-mono 13px
- `strong` weight 600
- `a` underline + couleur ink
- `h1/h2/h3` weights 600/500/500, tailles 20/18/16

## Dépendances à installer

```
bun add ai @ai-sdk/react @ai-sdk/openai-compatible react-markdown remark-gfm
```

## Routes

1. **`src/routes/index.tsx`** — réduit à un loader/component qui :
   - charge threads existants
   - si vide → `createThread()`
   - dans tous les cas → `redirect({ to: "/$threadId", params: { threadId: firstId } })`
   - sinon redirect vers le thread le plus récent

2. **`src/routes/$threadId.tsx`** — page principale :
   - Sidebar (composant) + main column
   - Récupère `threadId` via `Route.useParams()`
   - Charge messages initiaux depuis localStorage pour ce thread
   - Rend `<ChatView threadId={threadId} initialMessages={...} key={threadId} />`
   - Top-right : boutons "Log in" / "Sign up" (gardés, purement décoratifs)

## Détails techniques

- **Provider helper** : copier-coller exact du pattern `ai-sdk-lovable-gateway` (custom fetch avec capture run-id, `withLovableAiGatewayRunIdHeader` autour de la réponse stream)
- **Header `X-Lovable-AIG-SDK: vercel-ai-sdk`** obligatoire
- **`LOVABLE_API_KEY`** : auto-provisionné via `ai_gateway--create` au début
- **Gestion erreurs UI** : toast (composant `sonner` déjà dans shadcn template ? sinon `alert` simple) sur 429/402
- **Animation** : wordmark/cards en `pplx-fade-up`, messages en fade-in léger (150ms)
- **Input** : `Enter` envoie, `Shift+Enter` saut de ligne, bouton submit désactivé pendant `submitted`/`streaming`
- **Aucun changement** sur les styles existants (palette, typo, sidebar refaite la semaine dernière) — on ajoute uniquement la logique et la vue conversation

Résultat : on tape un prompt, on appuie Entrée → réponse streamée en markdown, conversation persistée, sidebar qui se met à jour avec le titre auto-extrait.
