"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flame, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiErrorMessage, login } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { user, accessToken } = await login({ email, password });
      setAuth({ id: user.id, email: user.email, role: user.role }, accessToken);
      router.push("/");
    } catch (err) {
      setError(getApiErrorMessage(err, "No pudimos iniciar sesión. Intenta nuevamente."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/3 size-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400/10 blur-3xl"
      />

      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-neutral-900/80 p-8 shadow-2xl backdrop-blur-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-amber-400/10 text-amber-400">
            <Flame className="size-6" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-white">Bienvenido de vuelta</h1>
          <p className="mt-1 text-sm text-neutral-400">Inicia sesión para continuar con tu compra</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div className="space-y-2">
            <Label htmlFor="login-email" className="text-neutral-200">
              Email
            </Label>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="tu@email.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 border-white/10 bg-neutral-950 text-white placeholder:text-neutral-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="login-password" className="text-neutral-200">
              Contraseña
            </Label>
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 border-white/10 bg-neutral-950 text-white placeholder:text-neutral-500"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300"
            >
              {error}
            </p>
          )}

          <Button
            id="login-submit"
            type="submit"
            disabled={loading || !email || !password}
            className="h-10 w-full cursor-pointer gap-2 rounded-xl bg-amber-400 font-semibold text-neutral-950 hover:bg-amber-300"
          >
            {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-400">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="font-medium text-amber-400 hover:underline">
            Regístrate
          </Link>
        </p>
      </div>
    </main>
  );
}
