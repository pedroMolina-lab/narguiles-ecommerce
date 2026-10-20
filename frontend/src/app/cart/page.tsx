"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ImageOff, MessageCircle, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart.store";

const formatPrice = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);

  const total = items.reduce((acc, item) => acc + item.precio * item.cantidad, 0);

  const handleWhatsAppCheckout = async () => {
    if (items.length === 0) return;

    const itemsText = items
      .map(
        (item) =>
          `- ${item.cantidad}x ${item.nombre} (${formatPrice(item.precio * item.cantidad)})`
      )
      .join("\n");

    const message = `Hola! Quiero realizar el siguiente pedido:\n${itemsText}\n\nTotal a pagar: ${formatPrice(total)}`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/5491100000000?text=${encodedMessage}`;

    window.open(whatsappUrl, "_blank");
    clearCart();
  };

  if (items.length === 0) {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="max-w-md rounded-2xl border border-dashed border-white/15 bg-neutral-900/50 px-6 py-14 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-amber-400/10 text-amber-400">
            <ShoppingBag className="size-7" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-semibold text-white">Tu carrito está vacío</h1>
          <p className="mt-2 text-sm text-neutral-400">
            Todavía no agregaste productos. Explora el catálogo y encuentra tu próximo narguile.
          </p>
          <Button
            id="cart-back-home"
            nativeButton={false}
            render={<Link href="/" />}
            className="mt-6 h-10 cursor-pointer gap-2 rounded-xl bg-amber-400 px-4 font-semibold text-neutral-950 hover:bg-amber-300"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Volver al inicio
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-white">Tu carrito</h1>
      <p className="mt-1 mb-8 text-sm text-neutral-400">Revisa tus productos antes de finalizar.</p>

      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-4 rounded-2xl border border-white/10 bg-neutral-900/80 p-3 sm:p-4"
          >
            <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-neutral-800 sm:size-24">
              {item.imagen ? (
                <Image
                  src={item.imagen}
                  alt={item.nombre}
                  fill
                  unoptimized
                  sizes="96px"
                  className="object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-neutral-600">
                  <ImageOff className="size-6" aria-hidden="true" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="line-clamp-2 text-base font-medium text-white">{item.nombre}</h2>
              <p className="mt-0.5 text-sm text-neutral-400">
                {item.cantidad} × {formatPrice(item.precio)}
              </p>
              <p className="mt-1 text-lg font-bold text-amber-400">
                {formatPrice(item.precio * item.cantidad)}
              </p>
            </div>

            <Button
              id={`cart-remove-${item.id}`}
              variant="ghost"
              onClick={() => removeItem(item.id)}
              aria-label={`Eliminar ${item.nombre} del carrito`}
              className="size-10 shrink-0 cursor-pointer rounded-full p-0 text-neutral-400 hover:bg-red-500/10 hover:text-red-400"
            >
              <Trash2 className="size-5" aria-hidden="true" />
            </Button>
          </li>
        ))}
      </ul>

      <section
        aria-label="Resumen de compra"
        className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-neutral-900/80 p-6"
      >
        <div className="flex items-center justify-between">
          <span className="text-neutral-300">Total</span>
          <span id="cart-total" className="text-2xl font-bold text-white">
            {formatPrice(total)}
          </span>
        </div>
        <Button
          id="cart-checkout-whatsapp"
          onClick={handleWhatsAppCheckout}
          className="h-12 w-full cursor-pointer gap-2 rounded-xl bg-emerald-500 text-base font-semibold text-white hover:bg-emerald-400"
        >
          <MessageCircle className="size-5" aria-hidden="true" />
          Finalizar compra por WhatsApp
        </Button>
      </section>
    </main>
  );
}
