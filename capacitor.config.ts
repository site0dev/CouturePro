import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'online.phenixconnect.couturepro',
  appName: 'CouturePro',
  webDir: 'dist',
  server: { androidScheme: 'https' },
  plugins: { SplashScreen: { launchShowDuration: 0 } }
};

export default config;
