"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      if (!user.emailVerified) {
        setMessage("⚠️ Verifica tu correo antes de iniciar sesión.");
        await auth.signOut();
        return;
      }

      setMessage("✅ Inicio de sesión exitoso.");
      router.push("/perfil"); // redirige al perfil
    } catch (error: unknown) {
      console.error(error);
      
      // Type narrowing para manejar el error correctamente
      if (error instanceof FirebaseError) {
        // Ahora TypeScript sabe que error es un FirebaseError
        if (error.code === "auth/invalid-credential") {
          setMessage("❌ Correo o contraseña incorrectos.");
        } else {
          setMessage(`❌ Error: ${error.message}`);
        }
      } else {
        // Para cualquier otro tipo de error
        setMessage("❌ Error desconocido al iniciar sesión.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-bg px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-md space-y-4"
      >
        <h1 className="text-2xl font-bold text-primary text-center">
          Iniciar sesión
        </h1>

        <input
          type="email"
          placeholder="Correo electrónico"
          className="input w-full"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Contraseña"
          className="input w-full"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" disabled={loading} className="btn btn--accent w-full">
          {loading ? "Iniciando..." : "Entrar"}
        </button>

        {message && <p className="text-sm text-center mt-2">{message}</p>}
      </form>

      <button
        onClick={() => router.push("/register")}
        className="btn btn--outline mt-4"
      >
        Crear una cuenta
      </button>
    </main>
  );
}