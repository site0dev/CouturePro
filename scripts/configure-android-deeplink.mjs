import fs from 'node:fs';
import path from 'node:path';

const manifestPath = path.resolve('android/app/src/main/AndroidManifest.xml');
if (!fs.existsSync(manifestPath)) {
  console.error('Manifest Android introuvable. Exécutez d’abord npx cap add android.');
  process.exit(1);
}
let xml = fs.readFileSync(manifestPath, 'utf8');
const scheme = 'online.phenixconnect.couturepro';
const activityPattern = /<activity\b(?=[^>]*android:name="[^"]*MainActivity")[^>]*>[\s\S]*?<\/activity>/m;
let match = xml.match(activityPattern);
if (!match) {
  console.error('Activité MainActivity introuvable dans AndroidManifest.xml.');
  process.exit(1);
}
let activity = match[0];
if (!activity.includes(`android:scheme="${scheme}"`)) {
  const filter = `\n            <intent-filter>\n                <action android:name="android.intent.action.VIEW" />\n                <category android:name="android.intent.category.DEFAULT" />\n                <category android:name="android.intent.category.BROWSABLE" />\n                <data android:scheme="${scheme}" android:host="auth" android:path="/recovery" />\n            </intent-filter>`;
  activity = activity.replace(/<\/activity>$/, `${filter}\n        </activity>`);
  xml = xml.replace(match[0], activity);
}
match = xml.match(activityPattern);
activity = match[0];
if (!/android:launchMode="singleTask"/.test(activity)) {
  activity = activity.replace('<activity', '<activity android:launchMode="singleTask"');
  xml = xml.replace(match[0], activity);
}
fs.writeFileSync(manifestPath, xml);
console.log('Deep link CouturePro configuré : ' + scheme + '://auth/recovery');
