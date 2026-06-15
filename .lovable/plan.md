
## Objectif

Rebrander l'app en **Obsidian** et ajouter un flow `/diagnostic` qui force l'utilisateur à passer 4 étapes de vérification (URL → propriété domaine → consentement → lancement) avant qu'un scan ne soit "déclenché". Tout reste **frontend** (state machine + localStorage), pas d'agents réels — on prépare juste le terrain UX/légal.

Design : on garde le langage visuel actuel (cream `#faf8f5`, ink `#27251e`, bordures `#ece9e2`, animations `pplx-fade-in` / `pplx-fade-up`, cartes arrondies, input pill noir). Aucun nouveau token couleur — on réutilise le système existant pour rester premium et cohérent.

---

## 1. Rebranding Obsidian

- Wordmark landing : `perplexity` → `obsidian` (même taille, même graisse)
- Footer disclaimers : `Perplexity may produce…` → `Obsidian may produce…`
- Title / meta dans `__root.tsx` et routes : `Obsidian — Automated pentest, democratized`
- Sidebar : ajouter un nouvel item nav `Diagnostic` (icône `ShieldCheck`) en haut de la liste, au-dessus de Discover. Clic → navigue vers `/diagnostic`.
- Cartes de suggestion sur la landing : remplacer les 5 suggestions génériques (quantum, S&P 500…) par 5 prompts cybersécurité orientés Obsidian :
  - `Lancer un diagnostic` (CTA principal, style légèrement accentué) → push `/diagnostic`
  - `Expliquer une CVE`
  - `Analyser un header HTTP`
  - `Comprendre OWASP Top 10`
  - `Auditer un site WordPress`

## 2. Nouvelle route `/diagnostic`

Fichier : `src/routes/diagnostic.tsx`. Pas un thread chat classique — c'est une **conversation guidée** rendue dans le même layout (sidebar + colonne centrale, max-width 760, bulles user `#f1efea`, réponses assistant en markdown). On réutilise les composants visuels mais on contrôle la state machine nous-mêmes (pas de `useChat`).

### State machine (frontend, localStorage)

```text
idle → awaiting_url → url_invalid (retry)
                   → awaiting_method
                       → method_chosen (dns | meta | file)
                           → awaiting_verification (polling simulé)
                               → verification_failed (retry / change method)
                               → verified
                                   → awaiting_consent
                                       → consent_given
                                           → scan_running (faux stream)
                                               → scan_complete
```

Chaque transition push une nouvelle "bulle" dans le chat avec animation `pplx-fade-in`. L'input du bas change de mode selon l'étape (texte libre, bouton CTA, checkbox + bouton, désactivé pendant scan).

### Étape 1 — URL

Bulle assistant : *"Quel domaine veux-tu analyser ?"* + petit texte gris *"Exemple : monsite.ma"*. Input texte normal. Validation regex domaine simple côté front. Si invalide → bulle assistant rouge subtile (bordure `#ece9e2`, texte `#27251e`) : *"Ce domaine n'a pas l'air valide. Réessaie."*

### Étape 2 — Choix méthode de vérification

Bulle assistant + carte avec 3 boutons côte à côte (réutilise le style `pplx-card`) :
- **Fichier .well-known** (icône `FileText`)
- **DNS TXT record** (icône `Globe`)
- **Meta tag HTML** (icône `Code`)

Génération d'un token unique côté front : `obsidian-verify-${nanoid(24)}`. Stocké dans le state de la conversation.

### Étape 3 — Instructions + polling

Selon la méthode choisie, on affiche une bulle assistant avec un bloc de code copiable :
- DNS : `obsidian-verify=TOKEN` à mettre en record TXT à la racine
- Meta : `<meta name="obsidian-verify" content="TOKEN" />`
- Fichier : poser `TOKEN` dans `https://domaine/.well-known/obsidian-verify.txt`

Chaque bloc a un bouton **Copier** (clipboard API) et un bouton **Vérifier maintenant**.

Polling simulé : quand l'user clique "Vérifier", on lance un `setInterval` toutes les 5s qui appelle une fonction `checkVerification(domain, method, token)` factice. Pour la démo, elle retourne `true` après 10–15s (avec une chance d'échec aléatoire ~20% pour montrer le retry path). Pendant le polling, bulle animée *"Vérification en cours…"* avec le shimmer `pplx-caret`. **Note technique :** la vraie vérification réseau (DNS lookup, HTTP GET) viendra plus tard via une serverFn — l'interface front est déjà branchée.

Une fois validé → bulle ✓ verte discrète *"Domaine vérifié : monsite.ma"*.

### Étape 4 — Consentement légal

Bulle assistant + carte avec :
- Texte légal : *"Je certifie être propriétaire du domaine `monsite.ma` ou disposer d'une autorisation écrite du propriétaire pour effectuer ce test de sécurité. Je comprends qu'un scan non autorisé peut constituer une infraction pénale dans ma juridiction."*
- Checkbox `J'accepte les CGU et la politique d'usage responsable`
- Bouton noir **Je confirme et je lance le scan** (désactivé tant que checkbox non cochée)

Au clic : on log dans `localStorage` (clé `obsidian:audit-trail`) un objet `{ domain, method, token, timestamp, userAgent, consentText }`. L'IP réelle nécessitera la serverFn plus tard — on note `ip: "pending-server-capture"` pour l'instant.

### Étape 5 — "Scan lancé"

Bulle assistant avec un faux stream :
- *"✓ Domaine vérifié"*
- *"✓ Consentement enregistré"*
- *"Initialisation des agents…"* (avec spinner)
- *"Web Recon agent : démarré"*, *"Network agent : démarré"*… (lignes qui apparaissent toutes les 800ms)
- Après ~6s : *"Scan en cours. Les résultats arriveront dans Library quand l'analyse sera terminée."* + bouton **Voir un exemple de rapport**.

Input du bas remplacé par un bandeau gris : *"Scan en cours — tu peux fermer cette fenêtre."*

## 3. Persistance

- `src/lib/diagnostic.ts` : types (`DiagnosticState`, `Step`, `VerificationMethod`, `AuditEntry`), helpers `loadDiagnostic()` / `saveDiagnostic()` / `appendAuditTrail()`.
- État stocké sous `obsidian:diagnostic:current` (un seul diagnostic actif à la fois pour commencer).
- Si l'user revient sur `/diagnostic` avec un état en cours → reprend à l'étape exacte.

## 4. Détails techniques (à zapper si non-tech)

- Nouveau fichier route : `src/routes/diagnostic.tsx` (TanStack file route).
- Nouveau composant : `src/components/DiagnosticFlow.tsx` qui contient la state machine (`useReducer`).
- Nouveau composant : `src/components/VerificationCard.tsx` (méthodes + instructions + copy).
- Nouveau composant : `src/components/ConsentCard.tsx`.
- `src/lib/diagnostic.ts` pour la persistance localStorage.
- Sidebar : ajout d'un item `Diagnostic` actif quand `pathname === "/diagnostic"`.
- Index landing : ajout d'un bouton CTA *"Lancer un diagnostic"* en plus des cartes existantes — clic = `navigate("/diagnostic")`.
- Aucun changement backend dans cette itération. Les TODOs sont laissés en commentaire (`// TODO: replace with serverFn calling DNS resolver / HTTP fetch`).

## 5. Hors scope (à clarifier plus tard)

- Vérification réelle (DNS lookup, HTTP GET) → nécessite serverFn + résolveur DNS Worker-compat
- Blacklist domaines sensibles → liste à fournir
- Rate limiting → backend
- KYC / pièce d'identité → auth + storage (Lovable Cloud)
- Audit trail persistant côté serveur (IP réelle) → DB
- Génération réelle du rapport de scan
