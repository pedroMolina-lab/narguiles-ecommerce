"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, ImageOff, Loader2, PackageX, Pencil, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/services/auth.service";
import { deleteProduct, getProductById, type Product } from "@/services/product.service";
import { useAuthStore } from "@/store/auth.store";
import { useCartStore } from "@/store/cart.store";

const formatPrice = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);

function ProductDetailContent() {
  const router = useRouter();
  const routeParams = useParams();
  const rawId = routeParams?.id;
  const id = typeof rawId === "string" ? rawId : Array.isArray(rawId) ? rawId[0] : "";

  const user = useAuthStore((state) => state.user);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    setImageError(false);
  }, [product?.imageUrl]);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    setLoading(true);
    setError(null);

    getProductById(String(id))
      .then((data) => {
        if (isMounted) setProduct(data);
      })
      .catch((err) => {
        if (isMounted) {
          setError(getApiErrorMessage(err, "No pudimos encontrar el producto solicitado."));
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleAddToCart = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!product) return;
    addItem({
      id: product.id,
      nombre: product.name,
      precio: product.price,
      imagen: product.imageUrl ?? "",
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer."
    );
    if (!confirmed) return;

    try {
      setDeleting(true);
      await deleteProduct(id);
      router.push("/");
    } catch (err) {
      alert(getApiErrorMessage(err, "No pudimos eliminar el producto. Intenta nuevamente."));
      setDeleting(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      {/* Botones de navegación superior */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/"
          id="back-to-catalog"
          className="inline-flex items-center gap-2 text-sm font-medium text-neutral-400 transition-colors hover:text-amber-400"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Volver al catálogo
        </Link>

        {user?.role === "ADMIN" && (
          <div className="flex items-center gap-2">
            <Button
              id="edit-product-button"
              variant="ghost"
              nativeButton={false}
              render={<Link href={`/admin/productos/editar/${id}`} />}
              className="h-9 cursor-pointer gap-1.5 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 text-sm font-medium text-amber-400 hover:bg-amber-400/20 hover:text-amber-300"
            >
              <Pencil className="size-4" aria-hidden="true" />
              Editar Producto
            </Button>

            <Button
              id="delete-product-button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="h-9 cursor-pointer gap-1.5 rounded-lg bg-red-600 px-3 text-sm font-medium text-white hover:bg-red-700"
            >
              {deleting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 className="size-4" aria-hidden="true" />
              )}
              Eliminar Producto
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 text-neutral-400">
          <Loader2 className="size-8 animate-spin text-amber-400" aria-hidden="true" />
          <p className="text-sm">Cargando producto...</p>
        </div>
      ) : error || !product ? (
        <div className="flex min-h-[350px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-neutral-900/40 p-8 text-center">
          <PackageX className="mb-3 size-10 text-neutral-500" aria-hidden="true" />
          <h1 className="text-xl font-semibold text-white">Producto no encontrado</h1>
          <p className="mt-1 max-w-md text-sm text-neutral-400">
            {error ?? "El producto que buscas no existe o ya no se encuentra disponible."}
          </p>
          <Button
            nativeButton={false}
            render={<Link href="/" />}
            className="mt-6 h-10 cursor-pointer gap-2 rounded-xl bg-amber-400 px-4 font-semibold text-neutral-950 hover:bg-amber-300"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Explorar catálogo
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 rounded-3xl border border-white/10 bg-neutral-900/60 p-6 backdrop-blur-sm sm:p-8 md:grid-cols-2 md:gap-12">
          {/* Lado izquierdo: Foto en grande */}
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-white/10 bg-neutral-950">
            {product.imageUrl && !imageError ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                unoptimized
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="flex size-full flex-col items-center justify-center gap-2 text-neutral-600">
                <ImageOff className="size-16" aria-hidden="true" />
                <span className="text-xs text-neutral-500">Sin fotografía disponible</span>
              </div>
            )}
          </div>

          {/* Lado derecho: Información del producto */}
          <div className="flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <span className="inline-block rounded-full bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-400">
                  {product.stock > 0 ? "En Stock" : "Sin Stock"}
                </span>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                  {product.name}
                </h1>
              </div>

              <div className="border-b border-white/10 pb-4">
                <p className="text-3xl font-extrabold text-amber-400 sm:text-4xl">
                  {formatPrice(product.price)}
                </p>
              </div>

              <div className="space-y-2">
                <h2 className="text-sm font-semibold tracking-wide uppercase text-neutral-400">
                  Descripción
                </h2>
                {product.description ? (
                  <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-300 sm:text-base">
                    {product.description}
                  </p>
                ) : (
                  <p className="italic text-neutral-500 text-sm">
                    Este producto no posee una descripción detallada.
                  </p>
                )}
              </div>
            </div>

            {/* Acciones de compra */}
            <div className="pt-4">
              <Button
                id="product-detail-add-to-cart"
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className="h-12 w-full cursor-pointer gap-2 rounded-xl bg-amber-400 text-base font-semibold text-neutral-950 transition-all hover:bg-amber-300"
              >
                {added ? (
                  <>
                    <Check className="size-5" aria-hidden="true" />
                    ¡Agregado al carrito!
                  </>
                ) : (
                  <>
                    <ShoppingCart className="size-5" aria-hidden="true" />
                    Agregar al carrito
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function ProductDetailPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-[400px] w-full max-w-6xl flex-1 flex-col items-center justify-center gap-3 px-4 py-8 text-neutral-400">
          <Loader2 className="size-8 animate-spin text-amber-400" aria-hidden="true" />
          <p className="text-sm">Cargando producto...</p>
        </main>
      }
    >
      <ProductDetailContent />
    </Suspense>
  );
}
