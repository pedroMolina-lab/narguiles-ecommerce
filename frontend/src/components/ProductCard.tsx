"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ImageOff, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useAuthStore } from "@/store/auth.store";
import { useCartStore } from "@/store/cart.store";

interface ProductCardProps {
  id: string | number;
  nombre: string;
  precio: number;
  imagen: string;
  description?: string | null;
  descripcion?: string | null;
}

const formatPrice = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);

export default function ProductCard({
  id,
  nombre,
  precio,
  imagen,
  description,
  descripcion,
}: ProductCardProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [imgError, setImgError] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const textDescription = description ?? descripcion ?? null;

  const handleAddToCart = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    addItem({ id, nombre, precio, imagen });
  };

  return (
    <Card className="group flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-neutral-900 p-0 text-neutral-100 ring-0 transition-all duration-300 hover:-translate-y-1 hover:border-amber-400/40 hover:shadow-[0_10px_40px_-10px_rgba(251,191,36,0.25)]">
      <div>
        <Link
          href={`/producto/${id}`}
          className="relative block aspect-square w-full overflow-hidden bg-neutral-800"
          aria-label={`Ver detalle de ${nombre}`}
        >
          {imagen && !imgError ? (
            <Image
              src={imagen}
              alt={nombre}
              fill
              unoptimized
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex size-full items-center justify-center text-neutral-600">
              <ImageOff className="size-10" aria-hidden="true" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/70 via-transparent to-transparent" />
        </Link>

        <CardContent className="space-y-2 px-4 pt-4">
          <Link href={`/producto/${id}`} className="block">
            <h3 className="line-clamp-2 text-base font-medium text-white transition-colors hover:text-amber-400">
              {nombre}
            </h3>
          </Link>
          <p className="text-xl font-bold text-amber-400">{formatPrice(precio)}</p>

          {textDescription && (
            <p className="line-clamp-2 text-sm text-neutral-400 leading-relaxed">
              {textDescription}
            </p>
          )}

          <div>
            <Link
              href={`/producto/${id}`}
              className="inline-block text-xs font-medium text-amber-400/90 transition-colors hover:text-amber-300 hover:underline"
            >
              Ver más...
            </Link>
          </div>
        </CardContent>
      </div>

      <CardFooter className="border-0 bg-transparent p-4">
        <Button
          id={`add-to-cart-${id}`}
          onClick={handleAddToCart}
          className="h-10 w-full cursor-pointer gap-2 rounded-xl bg-amber-400 font-semibold text-neutral-950 hover:bg-amber-300"
        >
          <ShoppingCart className="size-4" aria-hidden="true" />
          Agregar al carrito
        </Button>
      </CardFooter>
    </Card>
  );
}
