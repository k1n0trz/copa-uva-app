"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; // 👈 importar el router
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const router = useRouter(); // 👈 inicializar router

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje("");

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const user = cred.user;
      const token = await user.getIdToken();

      const resp = await fetch("http://127.0.0.1:8000/api/v1/users/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await resp.json();
      console.log("👤 Perfil:", resp.status, data);

      if (!resp.ok) throw new Error(data?.detail ?? "Login backend falló");

      setMensaje(`Bienvenida, ${data.nombre || "usuario"}`);

      // 🧭 Redirigir al perfil tras el login
      setTimeout(() => {
        router.push("/perfil");
      }, 500);

    } catch (err) {
      console.error(err);
      setMensaje("❌ Error de login. Revisa consola.");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={handleLogin} className="bg-white p-6 rounded-2xl shadow w-full max-w-md space-y-3">
        <h1 className="text-xl font-bold">Iniciar sesión</h1>
        <input
          className="input w-full"
          type="email"
          placeholder="Correo"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          className="input w-full"
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button className="btn btn--primary w-full" type="submit">Entrar</button>
        {mensaje && <p className="text-sm">{mensaje}</p>}
      </form>
    </main>
  );
}
