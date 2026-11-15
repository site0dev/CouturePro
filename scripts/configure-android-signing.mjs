import fs from 'node:fs';
import path from 'node:path';

const gradlePath = path.resolve('android/app/build.gradle');
const required = ['CM_KEYSTORE_PATH', 'CM_KEYSTORE_PASSWORD', 'CM_KEY_ALIAS', 'CM_KEY_PASSWORD'];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) throw new Error(`Variables de signature Codemagic manquantes : ${missing.join(', ')}`);
if (!fs.existsSync(gradlePath)) throw new Error(`Fichier Gradle introuvable : ${gradlePath}`);

let gradle = fs.readFileSync(gradlePath, 'utf8');
if (!gradle.includes('signingConfigs')) {
  const androidBlock = /android\s*\{/;
  if (!androidBlock.test(gradle)) throw new Error('Bloc android { introuvable dans android/app/build.gradle');
  gradle = gradle.replace(androidBlock, (match) => `${match}\n    signingConfigs {\n        release {\n            storeFile file(System.getenv('CM_KEYSTORE_PATH'))\n            storePassword System.getenv('CM_KEYSTORE_PASSWORD')\n            keyAlias System.getenv('CM_KEY_ALIAS')\n            keyPassword System.getenv('CM_KEY_PASSWORD')\n        }\n    }\n`);
}

const buildTypes = /buildTypes\s*\{/;
if (!buildTypes.test(gradle)) throw new Error('Bloc buildTypes { introuvable dans android/app/build.gradle');
const buildTypesIndex = gradle.search(buildTypes);
const releasePattern = /release\s*\{/g;
releasePattern.lastIndex = buildTypesIndex;
const releaseMatch = releasePattern.exec(gradle);
if (!releaseMatch) throw new Error('Bloc release { introuvable dans buildTypes');
const insertAt = releaseMatch.index + releaseMatch[0].length;
gradle = gradle.slice(0, insertAt) + `\n            signingConfig signingConfigs.release` + gradle.slice(insertAt);
fs.writeFileSync(gradlePath, gradle);
console.log('Signature release CouturePro configurée.');
