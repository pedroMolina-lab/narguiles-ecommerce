import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <main className="mx-auto flex min-h-[400px] w-full max-w-6xl flex-1 flex-col items-center justify-center gap-3 px-4 py-8 text-neutral-400">
      <Loader2 className="size-8 animate-spin text-amber-400" aria-hidden="true" />
      <p className="text-sm">Cargando producto...</p>
    </main>
  );
}
