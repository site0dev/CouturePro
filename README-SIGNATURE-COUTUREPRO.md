# Signature Android CouturePro

Application ID : `online.phenixconnect.couturepro`
Alias : `couturepro_release`
Fichier de clé : `CouturePro-release.jks` (à conserver hors du dépôt GitHub)

## Codemagic

1. Ouvrir Teams > Code signing identities > Android keystores.
2. Ajouter le fichier `CouturePro-release.jks`.
3. Nommer la référence `couturepro_release`.
4. Saisir l'alias et les mots de passe transmis séparément au propriétaire.
5. Lancer le workflow `CouturePro - APK Android signé` sur la branche `main`.

Ne jamais déposer le fichier JKS, ses mots de passe ou une copie des identifiants dans GitHub.

## Règle de mise à jour

Pour installer une nouvelle version par-dessus l'ancienne, conserver définitivement :
- le même applicationId : `online.phenixconnect.couturepro` ;
- le même keystore ;
- le même alias et les mêmes mots de passe.

Perdre la clé ou la remplacer empêchera les mises à jour directes des installations signées avec cette clé. Faire plusieurs sauvegardes hors ligne du JKS.
