import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lunchpot.app',
  appName: 'Lunchpot',
  webDir: 'www',
  server: {
    hostname: 'lunchpot',
    androidScheme: 'http' // change to https in production
  },
};

export default config;
