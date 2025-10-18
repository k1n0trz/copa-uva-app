// apps/web/src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

// ✅ Configuración de tu proyecto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyClgTAf_kd4HcuHWlxdphW-JIiGtS0jD_w",
  authDomain: "copa-uva-dev.firebaseapp.com",
  projectId: "copa-uva-dev",
  storageBucket: "copa-uva-dev.firebasestorage.app",
  messagingSenderId: "680156154609",
  appId: "1:680156154609:web:c31c3fba12df8a07b77750",
};

// 🚀 Inicializa Firebase solo una vez (Next.js friendly)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 🔥 Inicializa servicios
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app); // ✅ Storage listo para subir imágenes
export const provider = new GoogleAuthProvider();

// 🌎 Fuerza idioma español para Auth
auth.languageCode = "es";

// 📤 Exporta la app
export default app;
