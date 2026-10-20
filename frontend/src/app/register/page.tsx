"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flame, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiErrorMessage, register } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const trimmedPhone = phone.trim();
      const { user, accessToken } = await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        ...(trimmedPhone ? { phone: trimmedPhone } : {}),
      });

      setAuth({ id: user.id, email: user.email, role: user.role }, accessToken);
      router.push("/");
    } catch (err) {
      setError(getApiErrorMessage(err, "No pudimos crear tu cuenta. Intenta nuevamente."));
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 8;

  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-12 sm:py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/3 size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400/10 blur-3xl"
      />

      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-neutral-900/80 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-amber-400/10 text-amber-400">
            <Flame className="size-6" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-white">Crear cuenta</h1>
          <p className="mt-1 text-sm text-neutral-400">Únete para realizar pedidos y gestionar tus compras</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="register-firstName" className="text-neutral-200">
                Nombre
              </Label>
              <Input
                id="register-firstName"
                type="text"
                autoComplete="given-name"
                placeholder="Juan"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="h-10 border-white/10 bg-neutral-950 text-white placeholder:text-neutral-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-lastName" className="text-neutral-200">
                Apellido
              </Label>
              <Input
                id="register-lastName"
                type="text"
                autoComplete="family-name"
                placeholder="Pérez"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="h-10 border-white/10 bg-neutral-950 text-white placeholder:text-neutral-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-email" className="text-neutral-200">
              Email
            </Label>
            <Input
              id="register-email"
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
            <Label htmlFor="register-password" className="text-neutral-200">
              Contraseña
            </Label>
            <Input
              id="register-password"
              type="password"
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres (mayúscula, minúscula y número)"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 border-white/10 bg-neutral-950 text-white placeholder:text-neutral-500"
            />
            <p className="text-[11px] text-neutral-400">
              Debe incluir al menos una mayúscula, una minúscula y un número.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-phone" className="text-neutral-200">
              Teléfono <span className="text-xs text-neutral-400">(opcional)</span>
            </Label>
            <Input
              id="register-phone"
              type="tel"
              autoComplete="tel"
              placeholder="+54 9 11 1234-5678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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
            id="register-submit"
            type="submit"
            disabled={loading || !isFormValid}
            className="h-10 w-full cursor-pointer gap-2 rounded-xl bg-amber-400 font-semibold text-neutral-950 hover:bg-amber-300"
          >
            {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {loading ? "Creando cuenta..." : "Crear Cuenta"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-400">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-amber-400 hover:underline">
            Inicia sesión aquí
          </Link>
        </p>
      </div>
    </main>
  );
}
