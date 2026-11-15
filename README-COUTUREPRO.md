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

## Limite à compléter pour la récupération de mot de passe dans l'APK
L'URL de callback actuelle du HTML utilise le domaine web CouturePro (`location.origin`). Pour ouvrir automatiquement les liens de récupération dans l'application Android, il faudra connaître le domaine Vercel final puis configurer Android App Links et `assetlinks.json` avec l'empreinte SHA-256 du certificat CouturePro. Aucun domaine ni certificat n'est inventé dans ce paquet.
