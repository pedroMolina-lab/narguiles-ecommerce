"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, Flame, LogOut, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth.store";
import { useCartStore } from "@/store/cart.store";

const ROLE_LABELS = {
  ADMIN: "Admin",
  STAFF: "Staff",
  CUSTOMER: "Cliente",
} as const;

// true solo en el cliente: evita el desajuste de hidratación con el estado persistido.
const subscribe = () => () => {};
const useIsClient = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

export default function Navbar() {
  const router = useRouter();
  const isClient = useIsClient();
  const totalItems = useCartStore((state) => state.getTotalItems());
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-neutral-950/80 backdrop-blur-md">
      <nav
        aria-label="Navegación principal"
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
      >
        <Link
          href="/"
          id="navbar-logo"
          className="flex items-center gap-2 text-lg font-semibold tracking-wide text-white sm:text-xl"
        >
          <Flame className="size-5 text-amber-400" aria-hidden="true" />
          <span>
            Narguiles<span className="text-amber-400">Store</span>
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {isClient &&
            (user ? (
              <>
                {user.role === "ADMIN" && (
                  <Button
                    id="navbar-admin-product"
                    variant="ghost"
                    nativeButton={false}
                    render={<Link href="/admin/productos/nuevo" />}
                    className="h-9 cursor-pointer gap-1.5 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 text-amber-400 hover:bg-amber-400/20 hover:text-amber-300"
                  >
                    <PlusCircle className="size-4" aria-hidden="true" />
                    <span className="hidden sm:inline">Cargar Producto</span>
                    <span className="sm:hidden">Cargar</span>
                  </Button>
                )}

                <div className="hidden flex-col items-end leading-tight sm:flex">
                  <span
                    id="navbar-user-email"
                    className="max-w-[180px] truncate text-sm text-neutral-200"
                  >
                    {user.email}
                  </span>
                  <span className="text-[11px] font-medium uppercase tracking-wider text-amber-400">
                    {ROLE_LABELS[user.role] ?? user.role}
                  </span>
                </div>
                <Button
                  id="navbar-logout"
                  variant="ghost"
                  onClick={handleLogout}
                  className="h-9 cursor-pointer gap-1.5 rounded-lg px-3 text-neutral-200 hover:bg-white/10 hover:text-amber-400"
                >
                  <LogOut className="size-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Cerrar Sesión</span>
                  <span className="sm:hidden">Salir</span>
                </Button>
              </>
            ) : (
              <>
                <Button
                  id="navbar-login"
                  variant="ghost"
                  nativeButton={false}
                  render={<Link href="/login" />}
                  className="h-9 cursor-pointer rounded-lg px-3 text-neutral-200 hover:bg-white/10 hover:text-amber-400"
                >
                  Iniciar Sesión
                </Button>
                <Button
                  id="navbar-register"
                  nativeButton={false}
                  render={<Link href="/register" />}
                  className="h-9 cursor-pointer rounded-lg bg-amber-400 px-3 font-semibold text-neutral-950 hover:bg-amber-300"
                >
                  Crear Cuenta
                </Button>
              </>
            ))}

          <Link
            href="/cart"
            id="navbar-cart"
            aria-label={`Carrito, ${totalItems} productos`}
            className="relative inline-flex size-10 items-center justify-center rounded-full text-neutral-200 transition-colors hover:bg-white/10 hover:text-amber-400"
          >
            <ShoppingCart className="size-5" aria-hidden="true" />
            {totalItems > 0 && (
              <span
                id="navbar-cart-badge"
                className="absolute -right-0.5 -top-0.5 flex min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-[11px] font-bold leading-5 text-neutral-950"
              >
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </nav>
    </header>
  );
}
