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

// Iconos SVG inline para evitar dependencias externas
const Icons = {
  Calendar: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  ShoppingBag: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  ),
  Heart: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
  Bell: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  User: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Settings: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 1v6m0 6v6m-9-9h6m6 0h6"/>
    </svg>
  ),
  Activity: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  Droplet: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
    </svg>
  ),
  Moon: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  ),
  Target: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  Crown: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M2 8l10-2 10 2-2 12H4L2 8z"/>
      <circle cx="7" cy="8" r="2"/>
      <circle cx="12" cy="6" r="2"/>
      <circle cx="17" cy="8" r="2"/>
    </svg>
  ),
  Menu: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
  X: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  ChevronRight: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  Home: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  TrendingUp: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
};

export default function PerfilPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profileUrl, setProfileUrl] = useState("/user-profile.jpg");
  const [activeSection, setActiveSection] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando tu dashboard...</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    { id: "dashboard", icon: Icons.Home, label: "Dashboard" },
    { id: "calendario", icon: Icons.Calendar, label: "Calendario" },
    { id: "tienda", icon: Icons.ShoppingBag, label: "Tienda" },
    { id: "salud", icon: Icons.Heart, label: "Salud" },
    { id: "perfil", icon: Icons.User, label: "Mi Perfil" },
    { id: "premium", icon: Icons.Crown, label: "Premium" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-purple-50 transition-colors"
              >
                {mobileMenuOpen ? <Icons.X /> : <Icons.Menu />}
              </button>
              <div className="flex items-center space-x-2">
                {/* <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-500 rounded-xl flex items-center justify-center">
                  <Icons.Droplet />
                </div> */}
                <img src="/logo.png" alt="Copa Uva" className="w-32 h-auto" />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="relative p-2 rounded-lg hover:bg-purple-50 transition-colors">
                <Icons.Bell />
                <span className="absolute top-1 right-1 w-2 h-2 bg-pink-500 rounded-full"></span>
              </button>
              <div className="flex items-center space-x-3">
                <img
                  src={profileUrl}
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover border-2 border-purple-200"
                />
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-semibold text-gray-800">{formData.nombre || "Usuario"}</p>
                  <p className="text-xs text-gray-500">Miembro Premium</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className={`lg:w-64 ${mobileMenuOpen ? 'block' : 'hidden'} lg:block`}>
            <nav className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                      activeSection === item.id
                        ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg"
                        : "text-gray-700 hover:bg-purple-50"
                    }`}
                  >
                    <IconComponent />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
              
              <div className="pt-4 mt-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    auth.signOut();
                    router.push("/");
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all"
                >
                  <Icons.Settings />
                  <span className="font-medium">Cerrar Sesión</span>
                </button>
              </div>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {activeSection === "dashboard" && (
              <div className="space-y-6">
                {/* Welcome Banner */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-500 rounded-2xl p-6 text-white shadow-lg">
                  <h2 className="text-2xl font-bold mb-2">¡Bienvenida de nuevo, {formData.nombre || "Usuario"}! 👋</h2>
                  <p className="text-purple-100">Tu próximo período está previsto para dentro de 12 días</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                        <Icons.Droplet />
                      </div>
                      <span className="text-2xl font-bold text-gray-800">28</span>
                    </div>
                    <p className="text-sm text-gray-600 font-medium">Días de ciclo</p>
                    <p className="text-xs text-gray-400 mt-1">Promedio actual</p>
                  </div>

                  <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <Icons.Activity />
                      </div>
                      <span className="text-2xl font-bold text-gray-800">5</span>
                    </div>
                    <p className="text-sm text-gray-600 font-medium">Días de flujo</p>
                    <p className="text-xs text-gray-400 mt-1">Último registro</p>
                  </div>

                  <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Icons.Moon />
                      </div>
                      <span className="text-2xl font-bold text-gray-800">85%</span>
                    </div>
                    <p className="text-sm text-gray-600 font-medium">Precisión IA</p>
                    <p className="text-xs text-gray-400 mt-1">Predicciones</p>
                  </div>

                  <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <Icons.Target />
                      </div>
                      <span className="text-2xl font-bold text-gray-800">42</span>
                    </div>
                    <p className="text-sm text-gray-600 font-medium">Registros</p>
                    <p className="text-xs text-gray-400 mt-1">Este mes</p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-800">Acciones Rápidas</h3>
                      <Icons.Calendar />
                    </div>
                    <div className="space-y-3">
                      <button 
                        onClick={() => setActiveSection("calendario")}
                        className="w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-all group"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                            <Icons.Calendar />
                          </div>
                          <div className="text-left">
                            <p className="font-semibold text-gray-800">Ver Calendario</p>
                            <p className="text-xs text-gray-500">Consulta tu ciclo</p>
                          </div>
                        </div>
                        <Icons.ChevronRight />
                      </button>

                      <button className="w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-all group">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                            <Icons.Activity />
                          </div>
                          <div className="text-left">
                            <p className="font-semibold text-gray-800">Registrar Síntomas</p>
                            <p className="text-xs text-gray-500">Actualiza tu estado</p>
                          </div>
                        </div>
                        <Icons.ChevronRight />
                      </button>

                      <button 
                        onClick={() => setActiveSection("tienda")}
                        className="w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-all group"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                            <Icons.ShoppingBag />
                          </div>
                          <div className="text-left">
                            <p className="font-semibold text-gray-800">Ir a Tienda</p>
                            <p className="text-xs text-gray-500">Explora productos</p>
                          </div>
                        </div>
                        <Icons.ChevronRight />
                      </button>
                    </div>
                  </div>

                  {/* Cycle Insights */}
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-800">Insights del Ciclo</h3>
                      <Icons.TrendingUp />
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">Fase Folicular</p>
                          <p className="text-xs text-gray-500 mt-1">Energía alta, ideal para nuevos proyectos</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-pink-500 rounded-full mt-2"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">Fertilidad</p>
                          <p className="text-xs text-gray-500 mt-1">Tu ventana fértil será en 8-10 días</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">Hidratación</p>
                          <p className="text-xs text-gray-500 mt-1">Recuerda beber 2L de agua al día</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Premium Banner */}
                <div className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <Icons.Crown />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">Desbloquea Premium</h3>
                        <p className="text-white/90 text-sm">Accede a predicciones avanzadas con IA y más funciones</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setActiveSection("premium")}
                      className="px-6 py-3 bg-white text-amber-600 font-semibold rounded-xl hover:bg-amber-50 transition-all shadow-lg"
                    >
                      Actualizar Ahora
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "perfil" && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Mi Perfil</h2>
                  
                  <div className="flex flex-col items-center space-y-4 mb-6">
                    <img
                      src={profileUrl}
                      alt="Foto de perfil"
                      className="w-32 h-32 rounded-full object-cover border-4 border-purple-200 shadow-lg"
                    />
                    {editing && (
                      <label className="px-4 py-2 bg-purple-600 text-white rounded-lg cursor-pointer hover:bg-purple-700 transition-colors">
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {(["nombre", "edad", "ciudad", "pais", "direccion"] as const).map((field) => (
                      <div key={field} className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 capitalize">
                          {field}
                        </label>
                        <input
                          type={field === "edad" ? "number" : "text"}
                          name={field}
                          placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                          value={formData[field]}
                          onChange={handleChange}
                          readOnly={!editing}
                          className={`w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all ${
                            !editing ? "bg-gray-50 cursor-default" : "bg-white"
                          }`}
                        />
                      </div>
                    ))}
                  </div>

                  {!editing ? (
                    <button
                      type="button"
                      className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-600 transition-all shadow-lg"
                      onClick={() => setEditing(true)}
                    >
                      Editar Información
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-600 transition-all shadow-lg disabled:opacity-50"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? "Guardando..." : "Guardar Cambios"}
                    </button>
                  )}

                  {message && (
                    <p className="text-sm text-center mt-4 p-3 bg-purple-50 text-purple-700 rounded-lg">
                      {message}
                    </p>
                  )}
                </div>
              </div>
            )}

            {activeSection === "calendario" && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Calendario Menstrual</h2>
                <div className="h-96 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Icons.Calendar />
                    </div>
                    <p className="text-gray-500">El calendario interactivo se cargará aquí</p>
                    <button className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                      Ver mi ciclo completo
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "tienda" && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Tienda Copa Uva</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                      { name: "Copa Menstrual", price: "$49.990", emoji: "🌸", color: "pink" },
                      { name: "Kit de Limpieza", price: "$24.990", emoji: "🧼", color: "blue" },
                      { name: "Lubricante Natural", price: "$19.990", emoji: "💧", color: "purple" },
                      { name: "Bolsa de Transporte", price: "$14.990", emoji: "👜", color: "green" },
                      { name: "Esterilizador", price: "$34.990", emoji: "🔥", color: "red" },
                      { name: "Pack Completo", price: "$89.990", emoji: "📦", color: "amber" },
                    ].map((product, idx) => (
                      <div key={idx} className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 hover:shadow-lg transition-all">
                        <div className="text-5xl mb-4">{product.emoji}</div>
                        <h3 className="font-bold text-gray-800 mb-2">{product.name}</h3>
                        <p className="text-2xl font-bold text-purple-600 mb-4">{product.price}</p>
                        <button className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2">
                          <Icons.ShoppingBag />
                          <span>Agregar</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeSection === "salud" && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Centro de Salud</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="p-6 bg-gradient-to-br from-red-50 to-pink-50 rounded-xl hover:shadow-md transition-shadow cursor-pointer">
                      <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-4 shadow-sm">
                        <Icons.Heart />
                      </div>
                      <h3 className="font-bold text-gray-800 mb-2">Estado de Ánimo</h3>
                      <p className="text-sm text-gray-600">Registra cómo te sientes hoy</p>
                    </div>
                    <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl hover:shadow-md transition-shadow cursor-pointer">
                      <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-4 shadow-sm">
                        <Icons.Activity />
                      </div>
                      <h3 className="font-bold text-gray-800 mb-2">Síntomas</h3>
                      <p className="text-sm text-gray-600">Monitorea tus síntomas diarios</p>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-6">
                    <h3 className="font-bold text-gray-800 mb-4">Recomendaciones de Hoy</h3>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3 bg-white/60 rounded-lg p-3">
                        <span className="text-2xl">💧</span>
                        <div>
                          <p className="font-medium text-gray-800">Mantente hidratada</p>
                          <p className="text-xs text-gray-600">Bebe al menos 2 litros de agua</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 bg-white/60 rounded-lg p-3">
                        <span className="text-2xl">🧘‍♀️</span>
                        <div>
                          <p className="font-medium text-gray-800">Yoga suave</p>
                          <p className="text-xs text-gray-600">15 minutos de estiramientos</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 bg-white/60 rounded-lg p-3">
                        <span className="text-2xl">🥗</span>
                        <div>
                          <p className="font-medium text-gray-800">Alimentación balanceada</p>
                          <p className="text-xs text-gray-600">Incluye verduras de hoja verde</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "premium" && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-600 to-pink-500 rounded-2xl p-8 text-white shadow-xl">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
                    <Icons.Crown />
                  </div>
                  <h2 className="text-3xl font-bold mb-2">Copa Uva Premium</h2>
                  <p className="text-purple-100 mb-6">Desbloquea todas las funciones y lleva tu experiencia al siguiente nivel</p>
                  <button className="px-8 py-3 bg-white text-purple-600 font-bold rounded-xl hover:bg-purple-50 transition-all shadow-lg">
                    Comenzar Prueba Gratis - 7 días
                  </button>
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-6">Características Premium</h3>
                  <div className="space-y-4">
                    {[
                      { title: "Predicciones con IA Avanzada", desc: "Algoritmos inteligentes para predicciones más precisas" },
                      { title: "Análisis de Patrones", desc: "Identifica tendencias en tu ciclo menstrual" },
                      { title: "Notificaciones Personalizadas", desc: "Alertas inteligentes basadas en tu historial" },
                      { title: "Reportes Descargables", desc: "Exporta tus datos para compartir con tu médico" },
                      { title: "Sin Publicidad", desc: "Experiencia premium sin interrupciones" },
                      { title: "Soporte Prioritario", desc: "Respuestas rápidas de nuestro equipo" },
                    ].map((feature, idx) => (
                      <div key={idx} className="flex items-start space-x-4 p-4 bg-purple-50 rounded-lg">
                        <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{feature.title}</p>
                          <p className="text-sm text-gray-600">{feature.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-center text-amber-800 font-semibold">
                      💎 Oferta especial: <span className="text-amber-600">$9.990/mes</span> - Ahorra 50%
                    </p>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-500 rounded-lg flex items-center justify-center">
                  <Icons.Droplet />
                </div>
                <h3 className="font-bold text-gray-800">Copa Uva</h3>
              </div>
              <p className="text-sm text-gray-600">Tu compañera en cada fase del ciclo menstrual</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Producto</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-purple-600 transition-colors">Características</a></li>
                <li><a href="#" className="hover:text-purple-600 transition-colors">Premium</a></li>
                <li><a href="#" className="hover:text-purple-600 transition-colors">Precios</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Recursos</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-purple-600 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-purple-600 transition-colors">Guías</a></li>
                <li><a href="#" className="hover:text-purple-600 transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-purple-600 transition-colors">Privacidad</a></li>
                <li><a href="#" className="hover:text-purple-600 transition-colors">Términos</a></li>
                <li><a href="#" className="hover:text-purple-600 transition-colors">Contacto</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-100 text-center text-sm text-gray-500">
            <p>© 2025 Copa Uva. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}