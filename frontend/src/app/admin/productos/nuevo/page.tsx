"use client";

import { useEffect, useState, useSyncExternalStore, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ImagePlus, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/services/auth.service";
import { getCategories, type Category } from "@/services/category.service";
import { createProduct } from "@/services/product.service";
import { useAuthStore } from "@/store/auth.store";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const subscribe = () => () => { };
const useIsClient = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

const inputClass = "h-10 border-white/10 bg-neutral-950 text-white placeholder:text-neutral-500";

export default function NuevoProductoPage() {
  const router = useRouter();
  const isClient = useIsClient();
  const user = useAuthStore((state) => state.user);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getCategories()
      .then((items) => {
        setCategories(items);
        if (items.length > 0) {
          setCategoryId(items[0].id);
        }
      })
      .catch((err) => {
        console.error("Error al cargar categorías:", err);
      })
      .finally(() => setLoadingCategories(false));
  }, []);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setError(null);
    if (preview) URL.revokeObjectURL(preview);

    if (file && !ALLOWED_TYPES.includes(file.type)) {
      setError("Solo se permiten imágenes JPG, PNG o WebP");
      e.target.value = "";
      setImage(null);
      setPreview(null);
      return;
    }
    if (file && file.size > MAX_IMAGE_BYTES) {
      setError("La imagen supera el máximo de 5 MB");
      e.target.value = "";
      setImage(null);
      setPreview(null);
      return;
    }
    setImage(file);
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await createProduct({
        name: name.trim(),
        description: description.trim() || undefined,
        price: Number(price),
        stock: Number(stock),
        categoryId: categoryId.trim(),
        image,
      });
      setSuccess(true);
      setTimeout(() => router.push("/"), 1500);
    } catch (err) {
      setError(getApiErrorMessage(err, "No pudimos guardar el producto. Intenta nuevamente."));
      setLoading(false);
    }
  };

  if (!isClient) return <main className="flex-1" />;

  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="max-w-md rounded-2xl border border-dashed border-white/15 bg-neutral-900/50 px-6 py-14 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-amber-400/10 text-amber-400">
            <ShieldAlert className="size-7" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-semibold text-white">Acceso restringido</h1>
          <p className="mt-2 text-sm text-neutral-400">
            Necesitas iniciar sesión con una cuenta de administrador para cargar productos.
          </p>
        </div>
      </main>
    );
  }

  const canSubmit = !loading && !success && name.trim() && price && categoryId.trim();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-white">Nuevo producto</h1>
      <p className="mt-1 mb-8 text-sm text-neutral-400">
        Completa los datos y sube una fotografía para publicarlo en el catálogo.
      </p>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-white/10 bg-neutral-900/80 p-6 sm:p-8"
      >
        <div className="space-y-2">
          <Label htmlFor="product-name" className="text-neutral-200">
            Nombre
          </Label>
          <Input
            id="product-name"
            required
            maxLength={200}
            placeholder="Narguile Clásico Dorado"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="product-description" className="text-neutral-200">
            Descripción
          </Label>
          <Textarea
            id="product-description"
            rows={4}
            maxLength={5000}
            placeholder="Describe el producto..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border-white/10 bg-neutral-950 text-white placeholder:text-neutral-500"
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="product-price" className="text-neutral-200">
              Precio
            </Label>
            <Input
              id="product-price"
              type="number"
              required
              min={0}
              step="0.01"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="product-stock" className="text-neutral-200">
              Stock
            </Label>
            <Input
              id="product-stock"
              type="number"
              required
              min={0}
              step={1}
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="product-category" className="text-neutral-200">
            Categoría
          </Label>
          {loadingCategories ? (
            <div className="h-10 flex items-center text-sm text-neutral-400">
              Cargando categorías...
            </div>
          ) : categories.length > 0 ? (
            <select
              id="product-category"
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="h-10 w-full rounded-md border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="" disabled>
                Selecciona una categoría
              </option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-neutral-900 text-white">
                  {cat.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="space-y-2">
              <Input
                id="product-category"
                required
                placeholder="UUID de la categoría (ej: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className={inputClass}
              />
              <p className="text-xs text-amber-400/80">
                No hay categorías cargadas en la base de datos. Pega un UUID o crea una categoría primero.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="product-image" className="text-neutral-200">
            Fotografía
          </Label>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-white/15 bg-neutral-950 text-neutral-600">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="Vista previa" className="size-full object-cover" />
              ) : (
                <ImagePlus className="size-8" aria-hidden="true" />
              )}
            </div>
            <div className="flex-1 space-y-1">
              <Input
                id="product-image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="h-10 cursor-pointer border-white/10 bg-neutral-950 text-neutral-300 file:mr-3 file:text-amber-400"
              />
              <p className="text-xs text-neutral-500">JPG, PNG o WebP. Máximo 5 MB.</p>
            </div>
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300"
          >
            {error}
          </p>
        )}

        {success && (
          <p
            role="status"
            className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300"
          >
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Producto creado con éxito. Redirigiendo...
          </p>
        )}

        <Button
          id="product-submit"
          type="submit"
          disabled={!canSubmit}
          className="h-11 w-full cursor-pointer gap-2 rounded-xl bg-amber-400 font-semibold text-neutral-950 hover:bg-amber-300"
        >
          {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {loading ? "Guardando..." : "Guardar Producto"}
        </Button>
      </form>
    </main>
  );
}
