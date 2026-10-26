# Final Plan — React/Vite → Profile-Only Android APK
### Windows · Capacitor 7 · Firebase · Offline-first · Google Sign-In

**Goal:** Package only `Profile.tsx` (with `Login.tsx` as the entry gate) into an Android APK that works offline, keeps the existing website untouched, and reuses the existing code.

**Decisions (locked in):**

| # | Decision | Choice |
|---|---|---|
| 1 | Google Sign-In on Android | `@codetrix-studio/capacitor-google-auth` → `GoogleAuthProvider.credential(idToken)` → Firebase. Web keeps `signInWithPopup`. |
| 2 | Offline storage | IndexedDB via `idb`. Five stores: `profile`, `pricelist`, `quotations`, `orderRequests`, `pendingOps`. |
| 3 | Email verification gate | Keep on web. **Skip on native.** |
| 4 | Routing on native | `HashRouter` + `/` → `AuthGate` → `Login` or `Profile` |
| 5 | Passwords | Never stored. Firebase Auth handles persistence. |

---

## PART 1 — Prerequisites (Windows)

Install once:

1. **Node.js LTS** — https://nodejs.org → verify `node -v`, `npm -v`
2. **JDK 17** (Temurin) — https://adoptium.net/temurin/releases/?version=17
3. **Android Studio** — https://developer.android.com/studio (let Setup Wizard finish)
4. **VS Code** — https://code.visualstudio.com

Set environment variables (System → Environment Variables):

| Variable | Value |
|---|---|
| `JAVA_HOME` | `C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot` |
| `ANDROID_HOME` | `C:\Users\<You>\AppData\Local\Android\Sdk` |
| `ANDROID_SDK_ROOT` | same as above |

Add to `Path`:
```
%JAVA_HOME%\bin
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\emulator
```

Open a **new** terminal. Verify:
```powershell
java -version
adb version
```

---

## PART 2 — Create the APK Project

We keep the existing web project **completely untouched**. New sibling folder.

```powershell
mkdir D:\Projects\profile-apk
cd D:\Projects\profile-apk

npm create vite@latest . -- --template react-ts
npm install
npm install react-router-dom firebase react-hot-toast lucide-react
npm install tailwindcss@3 postcss autoprefixer
npm install -D @types/node
```

Verify:
```powershell
npm run dev
```
Open `http://localhost:5173`. Stop with `Ctrl+C`.

---

## PART 3 — Copy What You Need From the Existing Project

Run from `D:\Projects\profile-apk`. Set `$SRC` to your existing project path.

```powershell
$SRC = "D:\Projects\original-web"   # ← change this

mkdir src\config, src\context, src\components\auth, src\components\common, src\offline, src\pages, src\types
mkdir public\assets\image

# Core
Copy-Item "$SRC\src\config\firebase.ts"          "src\config\"
Copy-Item "$SRC\src\config\cloudinary.ts"        "src\config\"   # only if Profile imports it
Copy-Item "$SRC\src\context\AuthContext.tsx"     "src\context\"
Copy-Item "$SRC\src\context\ThemeContext.tsx"    "src\context\"
Copy-Item "$SRC\src\components\auth\Login.tsx"          "src\components\auth\"
Copy-Item "$SRC\src\components\auth\ProtectedRoute.tsx" "src\components\auth\"
Copy-Item "$SRC\src\components\auth\helper.tsx"         "src\components\auth\"
Copy-Item "$SRC\src\components\common\ThemeToggle.tsx"  "src\components\common\"
Copy-Item "$SRC\src\components\common\Spinner.tsx"      "src\components\common\"
Copy-Item "$SRC\src\types\index.ts"              "src\types\"
Copy-Item "$SRC\src\pages\Profile.tsx"           "src\pages\"
Copy-Item "$SRC\src\index.css"                   "src\"
Copy-Item "$SRC\public\assets\image\*"           "public\assets\image\" -Recurse

# Build config
Copy-Item "$SRC\tailwind.config.js"    "."
Copy-Item "$SRC\postcss.config.js"     "."
Copy-Item "$SRC\tsconfig.json"         "."
Copy-Item "$SRC\tsconfig.app.json"     "."
Copy-Item "$SRC\tsconfig.node.json"    "."
Copy-Item "$SRC\vite.config.ts"        "."
```

**Check imports in `Profile.tsx`** and copy anything else it references (e.g. `Navbar.tsx`, `Footer.tsx`, `useSiteSettings.ts`, `pdf.ts`). Do **not** edit Profile to remove functionality — just copy the missing dependencies.

Confirm `vite.config.ts` has `base` unset or set to `'/'`.

---

## PART 4 — Install Capacitor + Native Plugins

```powershell
npm install @capacitor/core @capacitor/cli @capacitor/android
npm install @capacitor/preferences @capacitor/network
npm install @codetrix-studio/capacitor-google-auth
npm install idb
```

Verify: `npx cap --version` (should show `7.x.x`).

---

## PART 5 — Create New Files

### 5.1 `src/platform.ts`

```ts
import { Capacitor } from '@capacitor/core';

export const isNative  = Capacitor.isNativePlatform();
export const isAndroid = Capacitor.getPlatform() === 'android';
export const isWeb     = Capacitor.getPlatform() === 'web';
```

### 5.2 `src/offline/storage.ts` — IndexedDB wrapper

```ts
import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'profile-app';
const DB_VERSION = 1;

export const STORES = {
  profile:       'profile',
  pricelist:     'pricelist',
  quotations:    'quotations',
  orderRequests: 'orderRequests',
  pendingOps:    'pendingOps',
} as const;

export type StoreName = (typeof STORES)[keyof typeof STORES];

let dbPromise: Promise<IDBPDatabase> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        for (const name of Object.values(STORES)) {
          if (!db.objectStoreNames.contains(name)) db.createObjectStore(name);
        }
      },
    });
  }
  return dbPromise;
}

export const idbGet     = async <T>(s: StoreName, k: string) => (await getDB()).get(s, k) as Promise<T | undefined>;
export const idbSet     = async <T>(s: StoreName, k: string, v: T) => { await (await getDB()).put(s, v, k); };
export const idbDelete  = async (s: StoreName, k: string) => { await (await getDB()).delete(s, k); };
export const idbGetAll  = async <T>(s: StoreName) => (await getDB()).getAll(s) as Promise<T[]>;
export const idbClear   = async (s: StoreName) => { await (await getDB()).clear(s); };
```

### 5.3 `src/offline/sync.ts` — network watch + pending queue

```ts
import { Network } from '@capacitor/network';
import { idbGetAll, idbDelete, STORES } from './storage';

export type PendingOp =
  | { kind: 'submitOrderRequest'; payload: any; createdAt: number }
  | { kind: 'updateProfile'; uid: string; payload: any; createdAt: number };

type Handler = (op: PendingOp) => Promise<void>;
const handlers: Partial<Record<PendingOp['kind'], Handler>> = {};

export function registerHandler(kind: PendingOp['kind'], handler: Handler) {
  handlers[kind] = handler;
}

export async function drainPendingOps() {
  const ops = (await idbGetAll<{ id: string; op: PendingOp }>(STORES.pendingOps)) ?? [];
  ops.sort((a, b) => a.op.createdAt - b.op.createdAt);
  for (const { id, op } of ops) {
    const h = handlers[op.kind];
    if (!h) continue;
    try { await h(op); await idbDelete(STORES.pendingOps, id); }
    catch (e) { console.warn('[sync] op failed, retry later', e); break; }
  }
}

export function startNetworkWatch() {
  Network.addListener('networkStatusChange', (s) => { if (s.connected) drainPendingOps(); });
}
```

### 5.4 `src/offline/profileStore.ts` — data-access layer

```ts
import { onValue, push, ref, set } from 'firebase/database';
import { database } from '../config/firebase';
import { idbGet, idbSet, STORES } from './storage';
import { drainPendingOps, registerHandler } from './sync';

// ---- PROFILE ----
export const cacheProfile = (uid: string, data: any) => idbSet(STORES.profile, uid, data);
export const getCachedProfile = (uid: string) => idbGet<any>(STORES.profile, uid);

export function subscribeProfile(uid: string, cb: (d: any) => void) {
  getCachedProfile(uid).then((c) => c && cb(c));
  return onValue(ref(database, `users/${uid}`), (snap) => {
    const d = snap.val();
    if (d) { cacheProfile(uid, d); cb(d); }
  });
}

export async function updateProfile(uid: string, patch: any) {
  const existing = (await getCachedProfile(uid)) ?? {};
  const merged = { ...existing, ...patch, updatedAt: Date.now() };
  await cacheProfile(uid, merged);
  try {
    await set(ref(database, `users/${uid}`), merged);
  } catch {
    const id = `profile-${uid}-${Date.now()}`;
    await idbSet(STORES.pendingOps, id, {
      id, op: { kind: 'updateProfile', uid, payload: merged, createdAt: Date.now() },
    });
  }
  return merged;
}

// ---- PRICELIST ----
export function subscribePricelist(cb: (d: any) => void) {
  idbGet<any>(STORES.pricelist, 'tree').then((c) => c && cb(c));
  return onValue(ref(database, 'pricelist'), (snap) => {
    const d = snap.val();
    if (d) { idbSet(STORES.pricelist, 'tree', d); cb(d); }
  });
}

// ---- QUOTATIONS ----
export function subscribeMyQuotations(email: string, cb: (r: any[]) => void) {
  idbGet<any[]>(STORES.quotations, email).then((c) => c && cb(c));
  return onValue(ref(database, 'quotations/quotationList'), (snap) => {
    const all = snap.val() ?? {};
    const mine = Object.entries(all).map(([id, v]: any) => ({ id, ...v }))
      .filter((r) => r?.customer?.email === email);
    idbSet(STORES.quotations, email, mine);
    cb(mine);
  });
}

// ---- ORDER REQUESTS ----
export function subscribeMyOrderRequests(email: string, cb: (r: any[]) => void) {
  idbGet<any[]>(STORES.orderRequests, email).then((c) => c && cb(c));
  return onValue(ref(database, 'orderRequest'), (snap) => {
    const all = snap.val() ?? {};
    const mine = Object.entries(all).map(([id, v]: any) => ({ id, ...v }))
      .filter((r) => r?.customer?.email === email);
    idbSet(STORES.orderRequests, email, mine);
    cb(mine);
  });
}

export async function submitOrderRequest(payload: any) {
  const email = payload?.customer?.email ?? 'unknown';
  const cached = (await idbGet<any[]>(STORES.orderRequests, email)) ?? [];
  const localId = `local-${Date.now()}`;
  await idbSet(STORES.orderRequests, email, [{ id: localId, ...payload, _pending: true }, ...cached]);
  try {
    const r = push(ref(database, 'orderRequest'));
    await set(r, payload);
  } catch {
    const id = `order-${localId}`;
    await idbSet(STORES.pendingOps, id, {
      id, op: { kind: 'submitOrderRequest', payload, createdAt: Date.now() },
    });
  }
}

// ---- BOOT ----
let wired = false;
export function initOfflineLayer() {
  if (wired) return; wired = true;
  registerHandler('updateProfile', async (op) => {
    if (op.kind === 'updateProfile') await set(ref(database, `users/${op.uid}`), op.payload);
  });
  registerHandler('submitOrderRequest', async (op) => {
    if (op.kind === 'submitOrderRequest') {
      const r = push(ref(database, 'orderRequest'));
      await set(r, op.payload);
    }
  });
  drainPendingOps();
}
```

### 5.5 `src/main.tsx`

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { isNative } from './platform';
import './index.css';

const Router = isNative ? HashRouter : BrowserRouter;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  </React.StrictMode>
);
```

### 5.6 `src/App.tsx`

```tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import Login from './components/auth/Login';
import Profile from './pages/Profile';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Spinner from './components/common/Spinner';
import { isNative } from './platform';
import { initOfflineLayer } from './offline/profileStore';

function OfflineBoot() {
  useEffect(() => { initOfflineLayer(); }, []);
  return null;
}

// Decision 3: no verification gate on native
function NativeGate() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user ? <Profile /> : <Login />;
}

export default function App() {
  return (
    <>
      <OfflineBoot />
      <Routes>
        {isNative && <Route path="/" element={<NativeGate />} />}
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="*" element={isNative ? <Navigate to="/" replace /> : <Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}
```

---

## PART 6 — Edit the Copied Files

### 6.1 `AuthContext.tsx`
- Ensure `loading` starts `true` and flips to `false` in the first `onAuthStateChanged`.
- Public API (`useAuth`) unchanged.
- If any `emailVerified` sign-out logic exists here, guard it:
  ```tsx
  import { isNative } from '../platform';
  if (!isNative && !user.emailVerified) { /* existing sign-out */ }
  ```

### 6.2 `Login.tsx`

**Verification gate (Decision 3):**
```tsx
import { isNative } from '../../platform';

if (!isNative && !user.emailVerified) {
  await signOut(auth);
  toast.error('Verify your email first.');
  return;
}
```

**Google Sign-In (Decision 1):**
```tsx
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { GoogleAuthProvider, signInWithPopup, signInWithCredential } from 'firebase/auth';

async function handleGoogle() {
  if (isNative) {
    await GoogleAuth.initialize();
    const res = await GoogleAuth.signIn();
    const cred = GoogleAuthProvider.credential(res.authentication.idToken);
    await signInWithCredential(auth, cred);
  } else {
    await signInWithPopup(auth, new GoogleAuthProvider());
  }
}
```

### 6.3 `Profile.tsx`

Replace Firebase imports:
```tsx
// Remove:
import { database, onValue, push, ref, set } from "../config/firebase";

// Add:
import {
  subscribeProfile, subscribePricelist,
  subscribeMyQuotations, subscribeMyOrderRequests,
  updateProfile as saveProfile, submitOrderRequest,
} from "../offline/profileStore";
```

Replace listeners:
```tsx
useEffect(() => { if (!user) return; return subscribeProfile(user.uid, setProfile); }, [user]);
useEffect(() => subscribePricelist(setPricelist), []);
useEffect(() => {
  if (!user?.email) return;
  return subscribeMyQuotations(user.email, setQuotations);
}, [user]);
useEffect(() => {
  if (!user?.email) return;
  return subscribeMyOrderRequests(user.email, setOrders);
}, [user]);
```

Replace writes:
```tsx
await saveProfile(user.uid, { displayName, phone, address, company, gst, bio });
await submitOrderRequest({ customer: { email: user.email }, items });
```

`localStorage` keys (`portal-theme`, `portal-read-notifications`) → `@capacitor/preferences`:
```tsx
import { Preferences } from '@capacitor/preferences';
const { value } = await Preferences.get({ key: 'portal-theme' });
await Preferences.set({ key: 'portal-theme', value: theme });
```

---

## PART 7 — Capacitor Config

Create `capacitor.config.ts` at project root:

```ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourname.profile',
  appName: 'Profile',
  webDir: 'dist',
  android: { allowMixedContent: false },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com', // ← Web client ID from Firebase
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
```

---

## PART 8 — Build Web + Add Android

```powershell
npm run build
npx cap add android
npx cap sync android
```

If build fails with TS errors → run `npm run dev`, fix interactively, rebuild.

---

## PART 9 — Android Studio Setup

```powershell
npx cap open android
```

Wait for Gradle sync.

### 9.1 Name / package (optional)
- `android\app\src\main\res\values\strings.xml` → app label
- `android\app\build.gradle` → `applicationId`
- `android\app\src\main\AndroidManifest.xml` → package references

If you change `appId`, delete `android\` and re-run `npx cap add android`.

### 9.2 Icon + splash
```powershell
npm install -D @capacitor/assets
mkdir resources
# place icon.png (1024×1024) and splash.png (2732×2732)
npx capacitor-assets generate --android
npx cap sync android
```

### 9.3 Google Sign-In (Decision 1) — critical

**A. Get SHA-1:**
```powershell
cd android
.\gradlew signingReport
cd ..
```
Copy the `SHA1` value under `Variant: debug`.

**B. Register in Firebase:**
- Firebase Console → **Project Settings** → **Your apps** → **Web app** → **Add fingerprint** → paste SHA-1.

**C. Download `google-services.json`:**
- Same screen → Download → place at `android\app\google-services.json`.

**D. Apply Gradle plugin:**
- `android\build.gradle` (project level) → add to `dependencies`:
  ```gradle
  classpath 'com.google.gms:google-services:4.4.2'
  ```
- `android\app\build.gradle` (app level), at bottom:
  ```gradle
  apply plugin: 'com.google.gms.google-services'
  ```

**E. Sync:**
```powershell
npx cap sync android
```

Then re-sync in Android Studio.

> If any of A–D is missing, native Google Sign-In silently fails.

---

## PART 10 — Build the APK

### Debug APK
Android Studio → **Build → Build Bundle(s)/APK(s) → Build APK(s)**

Or:
```powershell
cd android
.\gradlew assembleDebug
cd ..
```
Output: `android\app\build\outputs\apk\debug\app-debug.apk`

Install:
```powershell
adb install -r android\app\build\outputs\apk\debug\app-debug.apk
```

### Release APK
```powershell
keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000

@"
storePassword=YOUR_STORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=my-key-alias
storeFile=../my-release-key.keystore
"@ | Out-File -Encoding ascii android\keystore.properties

# Add signingConfigs block to android\app\build.gradle

cd android
.\gradlew assembleRelease
cd ..
```
Output: `android\app\build\outputs\apk\release\app-release.apk`

For Play Store: `.\gradlew bundleRelease` → `.aab`.

---

## PART 11 — Test Matrix

| # | Scenario | Expected |
|---|---|---|
| 1 | Fresh install, no login | Login screen |
| 2 | Google login (with all of Part 9.3 done) | Native picker → Profile |
| 3 | Email/password login | Profile |
| 4 | Close & reopen (online) | Profile directly |
| 5 | Disable Wi-Fi/data, reopen | Profile from cache |
| 6 | Disable internet while inside Profile | UI works |
| 7 | Offline submit order request | Saved with `_pending: true` |
| 8 | Re-enable internet | Pending op syncs |
| 9 | Open `domain.com/login`, `/profile` on web | Unchanged |
| 10 | Uninstall + reinstall | Cache wiped, login again |

---

## PART 12 — Firebase Rules (Server-Side)

The current setup lets any authenticated user read all order requests and quotations. Fix:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null && auth.uid == $uid",
        ".write": "auth != null && auth.uid == $uid"
      }
    },
    "pricelist": {
      ".read": "auth != null",
      ".write": false
    },
    "quotations": {
      "quotationList": {
        ".read": "auth != null",
        ".write": false
      }
    },
    "orderRequest": {
      ".read": false,
      ".write": "auth != null",
      "$rid": {
        ".read": "auth != null && data.child('customer/email').val() == auth.token.email"
      }
    }
  }
}
```

**Real fix:** restructure so order requests live at `users/{uid}/orderRequests` and quotations at `users/{uid}/quotations`. Then no client-side filtering of global lists is required, and rules become trivial.

---

## PART 13 — Where the 3 Decisions Live

| Decision | Install | Config | Code | Extra |
|---|---|---|---|---|
| **1. Google Sign-In native** | Part 4: `@codetrix-studio/capacitor-google-auth` | Part 7: `serverClientId` | Part 6.2: `handleGoogle` | **Part 9.3**: SHA-1 + `google-services.json` + Gradle plugin |
| **2. IndexedDB offline** | Part 4: `idb` | — | Parts 5.2–5.4 + 6.3 | — |
| **3. Skip verification on native** | — | — | Parts 5.6 + 6.1 + 6.2 | — |

---

## PART 14 — Daily Workflow

After any web change:
```powershell
npm run build
npx cap sync android
npx cap open android
```
Then build APK in Android Studio (or `.\gradlew assembleDebug`).

---

## PART 15 — Windows Gotchas

| Problem | Fix |
|---|---|
| `java` not found | Install JDK 17, set `JAVA_HOME`, restart terminal |
| `adb` not found | Add `%ANDROID_HOME%\platform-tools` to Path |
| Gradle "JDK not found" | Android Studio → Settings → Gradle JDK → JDK 17 |
| Path length error | Enable `LongPathsEnabled` in registry |
| White screen after install | `webDir` must be `dist`; rebuild + `cap sync` |
| Google Sign-In fails silently | SHA-1 not registered, `google-services.json` missing, or Gradle plugin not applied → redo Part 9.3 |
| `cap add android` fails | `npm run build` first |
| Firebase session lost on app restart | Ensure `onAuthStateChanged` is subscribed before rendering routes |

---

## PART 16 — Final Checklist

**Created:**
- `src\platform.ts`
- `src\offline\storage.ts`, `sync.ts`, `profileStore.ts`
- `src\main.tsx` (rewritten)
- `src\App.tsx` (rewritten)
- `capacitor.config.ts`
- `android\` (generated)
- `android\app\google-services.json`
- `resources\icon.png`, `resources\splash.png`

**Copied from existing project:**
- `firebase.ts`, `cloudinary.ts`, `AuthContext.tsx`, `ThemeContext.tsx`
- `Login.tsx`, `ProtectedRoute.tsx`, `helper.tsx`
- `ThemeToggle.tsx`, `Spinner.tsx`, any other component `Profile.tsx` imports
- `Profile.tsx`, `types\index.ts`, `index.css`
- `public\assets\image\*`
- `tailwind.config.js`, `postcss.config.js`, `tsconfig*.json`, `vite.config.ts`

**Modified:**
- `AuthContext.tsx` — explicit `loading`, `!isNative` guard if needed
- `Login.tsx` — native Google Sign-In, `!isNative` verification gate
- `Profile.tsx` — use `profileStore`, not raw Firebase calls
- `android\build.gradle` — google-services classpath
- `android\app\build.gradle` — google-services plugin, signing config

**Rules of the road:**
- Never store passwords.
- Never point the APK at `https://domain.com/profile`.
- Never duplicate `Profile.tsx`. Only one copy, used by both web and native.
- Enforce real security in Firebase Rules, not just frontend checks.

---

**End.** Parts 1 → 10 in order. Don't skip Part 6.3 (Profile.tsx rewrite) or Part 9.3 (Google Sign-In native setup) — those are the two places where things silently break if missed.