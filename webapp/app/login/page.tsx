"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Icon from "@/components/Icon";
import { createClient } from "@/utils/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (err) {
      setError(
        err.message === "Invalid login credentials"
          ? "Email o contraseña incorrectos."
          : err.message
      );
      setLoading(false);
      return;
    }

    router.replace(nextUrl);
    router.refresh();
  };

  return (
    <div className="min-h-screen grid place-items-center px-6 bg-bg">
      <div className="w-full max-w-md">
        {/* Logo / marca */}
        <div className="text-center mb-8">
          <div className="gold-grad text-[32px] font-bold tracking-[0.15em]">
            SHIBBISHOP
          </div>
          <div className="mono text-[10px] tracking-[0.22em] text-text-muted mt-1">
            MANAGER · v2.0
          </div>
        </div>

        <div className="rounded-[14px] border border-border bg-surface-1 overflow-hidden">
          <div className="px-6 py-5 border-b border-surface-2">
            <div className="mono text-[10px] tracking-[0.2em] text-gold">
              ACCESO · PRIVADO
            </div>
            <h1 className="text-[20px] font-semibold mt-1">Inicia sesión</h1>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="text-[12px] font-medium text-text mb-1.5 block">
                Email
              </label>
              <div className="flex items-center h-10 rounded-lg bg-[#0E0E0E] border border-border px-3 focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/20">
                <Icon name="mail" size={14} className="text-[#555] mr-2" />
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-[13px] text-text placeholder:text-[#555]"
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            <div>
              <label className="text-[12px] font-medium text-text mb-1.5 block">
                Contraseña
              </label>
              <div className="flex items-center h-10 rounded-lg bg-[#0E0E0E] border border-border px-3 focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/20">
                <Icon name="settings" size={14} className="text-[#555] mr-2" />
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-[13px] text-text placeholder:text-[#555]"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-state-danger/40 bg-state-danger/10 p-3 text-[12px] text-[#F39C8E] flex items-start gap-2">
                <Icon name="info" size={13} className="mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full h-10 rounded-lg bg-gold text-bg text-[13px] font-semibold flex items-center justify-center gap-2 hover:bg-gold-light disabled:opacity-50"
            >
              {loading ? "Entrando…" : "Entrar"}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-[11px] text-text-muted">
          ¿Sin cuenta? Pide acceso al administrador.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen grid place-items-center text-text-muted">
          Cargando…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
