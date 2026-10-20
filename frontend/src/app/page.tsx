"use client";

import { PackageOpen, AlertCircle } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { useProducts } from "@/hooks/useProducts";

function ProductSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-white/10 bg-neutral-900">
      <div className="aspect-square bg-neutral-800" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 rounded bg-neutral-800" />
        <div className="h-6 w-1/3 rounded bg-neutral-800" />
        <div className="h-10 w-full rounded-xl bg-neutral-800" />
      </div>
    </div>
  );
}

function StateMessage({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-neutral-900/50 px-6 py-20 text-center">
      <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-amber-400/10 text-amber-400">
        {icon}
      </div>
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-neutral-400">{text}</p>
    </div>
  );
}

export default function Home() {
  const { products, loading, error } = useProducts();

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-white">Catálogo</h1>

      {loading ? (
        <div
          aria-busy="true"
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <StateMessage
          icon={<AlertCircle className="size-8" />}
          title="Algo salió mal"
          text={error}
        />
      ) : products.length === 0 ? (
        <StateMessage
          icon={<PackageOpen className="size-8" />}
          title="No hay productos disponibles por el momento"
          text="Estamos preparando nuevos productos. Vuelve a visitarnos muy pronto."
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              id={p.id}
              nombre={p.name}
              precio={p.price}
              imagen={p.imageUrl ?? ""}
              description={p.description}
            />
          ))}
        </div>
      )}
    </main>
  );
}
