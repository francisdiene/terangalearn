# TerangaLearn — Build Mobile (Capacitor)

## Prérequis sur ton PC Windows

### Android
1. Installer **Android Studio** : https://developer.android.com/studio
2. Dans Android Studio → SDK Manager → installer **Android SDK 35**
3. Ajouter à ton `PATH` :
   ```
   C:\Users\<toi>\AppData\Local\Android\Sdk\platform-tools
   ```

### iOS (Mac uniquement)
- Xcode 15+ requis
- `sudo gem install cocoapods`

---

## Workflow de build

### 1. Cloner et installer
```bash
git clone https://github.com/francisdiene/terangalearn
cd terangalearn
npm install
```

### 2. Build statique + sync Capacitor
```bash
# Build le Next.js en mode export statique + copie dans android/ios
npm run cap:sync
```

### 3. Ouvrir Android Studio
```bash
npm run cap:android
# → Android Studio s'ouvre sur le projet
```
Dans Android Studio :
- Attendre la sync Gradle (première fois : 5-10 min)
- **Run** → choisir un émulateur ou ton téléphone USB

### 4. Ouvrir Xcode (Mac)
```bash
npm run cap:ios
# → Xcode s'ouvre
```

---

## Dev en live (hot reload)

Pour tester sans rebuild à chaque fois :

1. Lancer le serveur Next.js :
   ```bash
   npm run dev
   # → http://localhost:3000
   ```

2. Trouver ton IP LAN (ex: 192.168.1.42) :
   ```bash
   ipconfig   # Windows
   ```

3. Dans `capacitor.config.ts`, décommenter :
   ```ts
   server: {
     url: 'http://192.168.1.42:3000',
     cleartext: true,
   }
   ```

4. Re-sync et relancer :
   ```bash
   npx cap sync
   # Puis relancer depuis Android Studio
   ```

> ⚠️ Remettre `server` en commentaire avant de builder pour la production !

---

## Build production APK

Dans Android Studio :
- **Build** → **Generate Signed Bundle / APK**
- Choisir **APK**
- Créer un keystore si première fois (garde le fichier `.jks` en sécurité !)
- Build type : **release**

L'APK sera dans `android/app/build/outputs/apk/release/`

---

## Google Play Store

1. Créer un compte Google Play Console (25$ unique)
2. **Build** → **Generate Signed Bundle / APK** → choisir **Android App Bundle (.aab)**
3. Uploader le `.aab` dans Play Console

---

## Structure des fichiers Capacitor

```
terangalearn/
├── capacitor.config.ts     ← Config principale
├── android/                ← Projet Android Studio
│   └── app/src/main/
│       ├── AndroidManifest.xml
│       └── res/            ← Icônes, splash screen
├── ios/                    ← Projet Xcode
│   └── App/
└── out/                    ← Build statique Next.js (généré)
```

---

## Icônes et Splash Screen

Prépare un PNG 1024×1024 de ton logo, puis utilise :
```bash
npm install -g @capacitor/assets
npx capacitor-assets generate --assetPath assets/logo.png
```

Ça génère automatiquement toutes les tailles pour Android et iOS.
