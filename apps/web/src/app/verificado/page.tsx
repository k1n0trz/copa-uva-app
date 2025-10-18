// apps/web/src/app/verificado/page.tsx
"use client";

import Link from "next/link";

export default function VerifiedPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-bg text-center p-6">
      <h1 className="text-2xl font-bold text-primary">¡Tu cuenta ha sido verificada! 🎉</h1>
      <p className="mt-3 text-gray-600 max-w-sm">
        Gracias por registrarte en Calendario Menstrual UVA. Ya puedes completar tu perfil y comenzar a usar la app.
      </p>
      <Link href="/perfil">
        <button className="btn btn--primary mt-6">Ir a mi perfil</button>
      </Link>
    </main>
  );
}
