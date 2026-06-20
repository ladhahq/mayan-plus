import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ladhahq.mayanplus',
  appName: 'Mayan Plus',
  webDir: 'dist',

  // Hide the status bar for immersive gameplay (via @capacitor/status-bar)
  // Plugins are auto-registered; status bar is handled in app init.

  // Use local server in dev so Vite's HMR works on device
  server: process.env.CAPACITOR_DEV
    ? { url: process.env.CAPACITOR_DEV_URL || 'http://192.168.1.100:5173', cleartext: true }
    : undefined,
};

export default config;
