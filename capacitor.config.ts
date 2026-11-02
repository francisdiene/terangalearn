import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'sn.terangalearn.app',
  appName: 'TerangaLearn',
  // En production : pointe vers Vercel pour garder les routes API
  // En dev local : 'webDir' sert le build statique
  webDir: 'out',
  server: {
    // Décommenter pour le dev sur émulateur (remplace l'IP par ton IP LAN)
    // url: 'http://192.168.x.x:3000',
    // cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      iosSpinnerStyle: 'small',
      spinnerColor: '#16a34a',
    },
    StatusBar: {
      style: 'default',
      backgroundColor: '#ffffff',
      overlaysWebView: false,
    },
  },
  android: {
    buildOptions: {
      // keystorePath: 'android/app/terangalearn.keystore',
      // keystoreAlias: 'terangalearn',
    },
  },
  ios: {
    contentInset: 'always',
  },
}

export default config
