"use client";

import { db, auth } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import Logo from "@/components/logo";
import { useRouter } from "next/navigation";
import { DocumentData } from "firebase/firestore";

export default function Home() {
  const router = useRouter();
  const [userData, setUserData] = useState<DocumentData | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        // Solo accedemos a la colección permitida por reglas
        const docRef = doc(db, "users", currentUser.uid);
        try {
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) setUserData(docSnap.data());
          else console.log("No hay documento de usuario todavía");
        } catch (err) {
          console.error("Error leyendo usuario ❌", err);
        }
      } else {
        setUserData(null);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-bg text-center">
      <Logo />

      <div className="mt-8 fade-in">
        <h1>Calendario Menstrual UVA</h1>
        <p className="text-gray-600">Tu bienestar, tu ciclo, tu espacio.</p>
      </div>

      <div className="flex flex-col gap-3 mt-10 w-64 fade-in">
        <button className="btn btn--primary">Iniciar sesión con Google</button>
        <button onClick={() => router.push("/login")} className="btn btn--accent">
          Iniciar con usuario
        </button>

        <div className="w-full flex items-center my-2">
          <div className="flex-grow border-t border-white/40"></div>
        </div>

        <button onClick={() => router.push("/register")} className="btn btn--outline">
          Crear una cuenta
        </button>
        <button className="btn btn--outline">Visita la tienda online</button>
      </div>
    </main>
  );
}
