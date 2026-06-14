Voici ce que je propose pour rapprocher l'interface du niveau Claude/ChatGPT tout en respectant la discipline achromatique de Perplexity.

## 1. Typographie pro (le plus gros impact)

Remplacer la pile par défaut par une vraie police variable type "Söhne-like" :
- **Inter Variable** (via `@fontsource-variable/inter`) chargé en local — c'est exactement la base utilisée par ChatGPT, et un substitut officiel de pplxSans listé dans le brief.
- Activer les *features* OpenType : `font-feature-settings: "cv11", "ss01", "ss03"` + `font-optical-sizing: auto` → rendu beaucoup plus net, proche de Söhne.
- `letter-spacing: -0.011em` sur le corps, `-0.025em` sur le wordmark (les gros titres respirent mieux serrés).
- Wordmark `perplexity` passé en `font-weight: 450` (entre 400 et 500) via axe variable pour un trait plus présent sans tomber dans le medium.
- `-webkit-font-smoothing: antialiased` + `text-rendering: optimizeLegibility` déjà OK, on ajoute `font-synthesis: none`.

## 2. Bouton sombre en haut à droite

Ajouter une **barre supérieure flottante** dans le main (pas de bordure, juste position absolue top-right, 16px de marge) contenant :
- Un bouton **"Sign up"** : pilule noire `#000000`, texte crème `#faf8f5`, 14px medium, padding `8px 16px`, hover → léger fade vers `#1a1a1a`.
- Un bouton ghost **"Log in"** à sa gauche : transparent, texte ink, hover background `#ece9e2`.

Cohérent avec la règle "le noir est l'action principale" — on garde le submit button rond comme seul autre élément noir.

## 3. Animations subtiles (jamais tape-à-l'œil)

Niveau Claude/Linear : tout en `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out doux), durées courtes.

- **Entrée page** : wordmark fade-in + slide-up 8px (400ms), input fade-in delay 100ms, cards fade-in en cascade (stagger 60ms par carte) via `animation-delay`.
- **Wordmark** : très léger `letter-spacing` animé au mount (de `-0.01em` à `-0.025em` sur 600ms) — effet "respiration" élégant.
- **Input focus** : border passe de `#ece9e2` à `#27251e` en 200ms, très subtil `box-shadow: 0 0 0 3px rgba(39,37,30,0.04)` (entorse contrôlée à la règle "pas d'ombre" — seulement sur focus, glow papier).
- **Nav items hover** : background `#ece9e2` fade-in 150ms.
- **Cards suggestions** : `translateY(-2px)` au hover en 200ms + border qui passe de `#ece9e2` à `#d4d2cc`.
- **Submit button** : scale `1 → 0.96` au active, hover scale `1.05`.
- **Curseur clignotant** custom dans le textarea (optionnel, signature Claude).

## 4. Détails finition

- Largeur sidebar : passer à `260px` strict avec padding interne `12px` (actuellement 16) — plus aéré comme ChatGPT.
- Wordmark sidebar : retirer (doublon avec le hero) OU le remplacer par un petit dot logo 24px.
- Search sidebar : retirer la bordure visible, fond `#f1efea`, focus seulement → look Notion/Claude.
- Espacement input ↔ cards : passer de 32px à 40px pour respirer.
- Footer discret en bas du main : "Perplexity may produce inaccurate information" en `#92918b` 12px (signature ChatGPT/Claude).

## Détails techniques

- Ajouter `@fontsource-variable/inter` via bun
- Import dans `src/styles.css` : `@import "@fontsource-variable/inter";`
- Variable `--font-sans: "Inter Variable", ...`
- Keyframes définis dans `styles.css` (fade-in-up, breathe)
- Animations appliquées par classes inline-style avec `animationDelay` calculé pour le stagger
- Aucune nouvelle dépendance d'animation (pas besoin de framer-motion pour ce niveau de subtilité)

Tout reste 100% achromatique, monochrome, conforme au brief Perplexity.
