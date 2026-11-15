# CouturePro — Web, Vercel et Android

Ce projet assemble le fichier HTML CouturePro du 14 novembre 2026 avec la structure de compilation issue de TechPro, adaptée à CouturePro.

## Fichiers principaux
- `index.html` : interface CouturePro (fonctionnalités conservées).
- `package.json`, `vite.config.ts` : compilation Vite.
- `vercel.json` : déploiement Vercel du dossier `dist`.
- `capacitor.config.ts`, `src/capacitor-bridge.js` : emballage Android Capacitor 8.
- `codemagic.yaml` : compilation automatique d'un APK Android de test.
- `api/couturepro-search.ts` : endpoint Vercel de recherche utilisé par l'assistant.
- `manifest.json`, `sw.js`, icônes : PWA.

## Déploiement Vercel
1. Importer le dépôt GitHub CouturePro dans Vercel.
2. Framework Preset : Other (ou Vite si proposé).
3. Build Command : `npm run build`.
4. Output Directory : `dist`.
5. Déployer. `vercel.json` contient déjà ces valeurs.

## APK avec Codemagic
1. Envoyer tout le contenu de ce dossier à la racine d'un dépôt GitHub nommé CouturePro.
2. Dans Codemagic, ajouter l'application en sélectionnant ce dépôt.
3. Garder `codemagic.yaml` à la racine et lancer le workflow `couturepro-android-debug`.
4. Télécharger l'artefact APK généré.

Le workflow produit un APK **debug de test**. Il n'utilise volontairement pas la clé privée TechPro. Une clé de signature propre à CouturePro sera nécessaire pour une version release destinée à la distribution.

## Supabase / FedaPay
- Le HTML conserve le projet Supabase `lcbrngbfbmluqfmrejqt` et sa clé publishable côté client.
- Les fonctions Edge `create-fedapay-payment` et `fedapay-webhook` restent hébergées sur Supabase : elles ne sont pas intégrées dans l'APK.
- Les secrets `FEDAPAY_SECRET_KEY`, `FEDAPAY_WEBHOOK_SECRET`, `ENV`, et les clés de service Supabase restent exclusivement dans Supabase Edge Function Secrets. Ne jamais les ajouter à GitHub, Vercel ou à l'application Android.

## Récupération du mot de passe (Web + Android)
- Sur le site Web, le lien revient sur le domaine courant avec `/?flow=recovery`.
- Dans l'application Android, le lien revient dans le WebView via `online.phenixconnect.couturepro://auth/recovery?flow=recovery`. Le vérificateur PKCE reste ainsi dans le stockage local de l'application.
- Le script `scripts/configure-android-deeplink.mjs` ajoute de manière idempotente le filtre Android nécessaire. Codemagic l'exécute après la création du projet Android et avant `cap sync`.

**Action obligatoire dans Supabase :** dans Authentication > URL Configuration > Redirect URLs, ajouter exactement `online.phenixconnect.couturepro://auth/recovery`. Conserver aussi le domaine Web de production (et son URL `/?flow=recovery`) dans la liste des Redirect URLs. Le domaine de production n'étant pas indiqué dans les fichiers, le code Web utilise volontairement le domaine courant plutôt que d'en inventer un.

Après modification, reconstruire et redéployer le site sur Vercel, puis lancer une nouvelle compilation Android sur Codemagic. Les liens de récupération envoyés avant cette mise à jour devront être remplacés par de nouveaux liens.
