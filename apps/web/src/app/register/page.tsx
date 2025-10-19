"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    nombre: "",
    edad: "",
    ciudad: "",
    pais: "",
    direccion: "",
    correo: "",
    contrasena: "",
  });

  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setMensaje("");

    try {
      const { correo, contrasena, ...datosUsuario } = formData;

      // 🔹 Crear usuario en Firebase Auth
      const credencialUsuario = await createUserWithEmailAndPassword(auth, correo, contrasena);
      const usuario = credencialUsuario.user;

      // 🔹 Guardar datos en Firestore
      await setDoc(doc(db, "users", usuario.uid), {
        ...datosUsuario,
        correo,
        creadoEn: new Date(),
      });

      // 🔹 Enviar correo de verificación
      await sendEmailVerification(usuario, {
        url: "https://copa-uva-dev.web.app/verificado",
      });

      // 🔹 Obtener token para sincronizar con backend (FastAPI)
      const token = await usuario.getIdToken();

      // 🔹 Enviar datos al backend para guardarlos en Postgres
      await fetch("http://localhost:8000/api/v1/user/create-or-sync", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid: usuario.uid,
          nombre: formData.nombre,
          edad: formData.edad,
          ciudad: formData.ciudad,
          pais: formData.pais,
          direccion: formData.direccion,
          correo: formData.correo,
        }),
      });

      setMensaje("✅ Cuenta creada. Revisa tu correo para verificar tu cuenta.");
      setFormData({
        nombre: "",
        edad: "",
        ciudad: "",
        pais: "",
        direccion: "",
        correo: "",
        contrasena: "",
      });
    } catch (error: any) {
      console.error("Error en registro:", error);
      setMensaje(`❌ Error: ${error.message}`);
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-bg px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-md space-y-4"
      >
        <h1 className="text-2xl font-bold text-primary text-center">Crear cuenta</h1>

        <input
          type="text"
          name="nombre"
          placeholder="Nombre completo"
          className="input w-full"
          value={formData.nombre}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="edad"
          placeholder="Edad"
          className="input w-full"
          value={formData.edad}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="ciudad"
          placeholder="Ciudad"
          className="input w-full"
          value={formData.ciudad}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="pais"
          placeholder="País"
          className="input w-full"
          value={formData.pais}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="direccion"
          placeholder="Dirección"
          className="input w-full"
          value={formData.direccion}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="correo"
          placeholder="Correo electrónico"
          className="input w-full"
          value={formData.correo}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="contrasena"
          placeholder="Contraseña"
          className="input w-full"
          value={formData.contrasena}
          onChange={handleChange}
          required
        />

        <button type="submit" disabled={cargando} className="btn btn--primary w-full">
          {cargando ? "Creando cuenta..." : "Registrarse"}
        </button>

        {mensaje && <p className="text-sm text-center mt-2">{mensaje}</p>}
      </form>
    </main>
  );
}
