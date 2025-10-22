"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
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

      // 🔹 Crear usuario en Firebase Authentication
      const credencialUsuario = await createUserWithEmailAndPassword(
        auth,
        correo,
        contrasena
      );
      const usuario = credencialUsuario.user;

      // 🔹 Guardar datos básicos en Firestore
      await setDoc(doc(db, "users", usuario.uid), {
        ...datosUsuario,
        correo,
        creadoEn: new Date(),
      });

      // 🔹 Enviar correo de verificación
      await sendEmailVerification(usuario, {
        url: "https://copa-uva-dev.web.app/verificado",
      });

      // 🔹 Enviar datos al backend para guardarlos en PostgreSQL
      try {
        const response = await fetch(
          "http://127.0.0.1:8000/api/v1/users/register",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              firebase_uid: usuario.uid, // 👈 añadimos el UID de Firebase
              nombre: formData.nombre,
              correo: formData.correo,
              ciudad: formData.ciudad,
              pais: formData.pais,
              direccion: formData.direccion,
              edad: Number(formData.edad),
            }),
          }
        );

        console.log("📡 Respuesta del backend:", response.status);
        const data = await response.json().catch(() => ({}));
        console.log("📦 Data:", data);

        if (!response.ok) {
          throw new Error(`Error en backend: ${response.status}`);
        }
      } catch (error) {
        console.error("❌ Error al enviar datos al backend:", error);
      }

      // 🔹 Mensaje final al usuario
      setMensaje(
        "✅ Cuenta creada correctamente. Revisa tu correo para verificar tu cuenta."
      );

      // 🔹 Reset del formulario
      setFormData({
        nombre: "",
        edad: "",
        ciudad: "",
        pais: "",
        direccion: "",
        correo: "",
        contrasena: "",
      });
    } catch (error) {
      console.error("❌ Error en registro Firebase:", error);
      setMensaje("❌ Error al crear cuenta. Revisa la consola.");
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
        <h1 className="text-2xl font-bold text-primary text-center">
          Crear cuenta
        </h1>

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

        <button
          type="submit"
          disabled={cargando}
          className="btn btn--primary w-full"
        >
          {cargando ? "Creando cuenta..." : "Registrarse"}
        </button>

        {mensaje && <p className="text-sm text-center mt-2">{mensaje}</p>}
      </form>
    </main>
  );
}
