"use client";

import { useEffect, useState } from "react";
import { auth, db, storage } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";

interface FormData {
  nombre: string;
  edad: string;
  ciudad: string;
  pais: string;
  direccion: string;
}

export default function PerfilPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profileUrl, setProfileUrl] = useState("/user-profile.jpg");
  const [formData, setFormData] = useState<FormData>({
    nombre: "",
    edad: "",
    ciudad: "",
    pais: "",
    direccion: "",
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/");
        return;
      }
      setUser(currentUser);

      const docRef = doc(db, "users", currentUser.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setFormData({
          nombre: data.nombre || currentUser.displayName || "",
          edad: data.edad || "",
          ciudad: data.ciudad || "",
          pais: data.pais || "",
          direccion: data.direccion || "",
        });
        setProfileUrl(data.photoURL || "/user-profile.jpg");
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editing) return;
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !editing || !e.target.files?.length) return;

    const file = e.target.files[0];
    const storageRef = ref(storage, `profiles/${user.uid}/${file.name}`);

    setProfileUrl(URL.createObjectURL(file));

    setUploading(true);
    setMessage("");
    try {
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      await setDoc(doc(db, "users", user.uid), { photoURL: downloadURL }, { merge: true });
      setProfileUrl(downloadURL);
      setMessage("✅ Foto de perfil actualizada.");
    } catch (error: any) {
      console.error(error);
      setMessage(`❌ Error al subir la imagen: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setMessage("");
    try {
      await setDoc(
        doc(db, "users", user.uid),
        { ...formData, email: user.email, photoURL: profileUrl, updatedAt: new Date() },
        { merge: true }
      );
      setMessage("✅ Perfil actualizado con éxito.");
      setEditing(false);
    } catch (error: any) {
      console.error(error);
      setMessage(`❌ Error al guardar: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Cargando perfil...</p>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-bg px-4">
      <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-primary text-center">Mi perfil</h1>

        <div className="flex flex-col items-center space-y-3">
          <img
            src={profileUrl}
            alt="Foto de perfil"
            className="w-28 h-28 rounded-full object-cover border-4 border-primary/30 shadow-sm"
          />
          {editing && (
            <label className="btn btn--outline cursor-pointer">
              {uploading ? "Subiendo..." : "Cambiar foto"}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          )}
        </div>

        {(["nombre", "edad", "ciudad", "pais", "direccion"] as const).map((field) => (
          <input
            key={field}
            type={field === "edad" ? "number" : "text"}
            name={field}
            placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
            value={formData[field]}
            onChange={handleChange}
            readOnly={!editing}
            className={`input w-full ${!editing ? "cursor-default" : ""}`}
          />
        ))}

        {!editing ? (
          <button
            type="button"
            className="btn btn--primary w-full"
            onClick={() => setEditing(true)}
          >
            Editar información
          </button>
        ) : (
          <button
            type="button"
            className="btn btn--primary w-full"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        )}

        {message && <p className="text-sm text-center mt-2">{message}</p>}
      </div>

      <button
        onClick={() => {
          auth.signOut();
          router.push("/");
        }}
        className="btn btn--outline mt-4"
      >
        Cerrar sesión
      </button>
    </main>
  );
}
