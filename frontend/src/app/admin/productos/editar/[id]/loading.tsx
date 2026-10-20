import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 text-neutral-400">
      <Loader2 className="size-8 animate-spin text-amber-400" aria-hidden="true" />
      <p className="text-sm">Cargando...</p>
    </div>
  );
}
