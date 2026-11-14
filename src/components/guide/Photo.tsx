/**
 * Foto do guia, com legenda e número (o mesmo da lista de fotos a tirar).
 *
 * Sem arquivo, mostra o espaço reservado no tamanho certo: a página já fica
 * com a cara final, e quando a foto chega é só apontar o `src`. Com arquivo,
 * tocar abre o visualizador (zoom com a roda, pinça ou duplo toque).
 *
 * O visualizador é um só para a página toda: <PhotoViewer /> montado uma vez.
 */
import { useSyncExternalStore } from "react";
import { Camera, Maximize2 } from "lucide-react";
import ZoomableImage from "@/components/ZoomableImage";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useLenisLock } from "@/components/motion/useLenisLock";
import { cn } from "@/lib/utils";

export type PhotoInfo = {
  n: string;
  title: string;
  caption: string;
  ratio: string;
  src?: string;
};

/* ------------------------------------------------------------------ visualizador */

type Shown = { src: string; alt: string; title: string; caption: string; n?: string };
let shown: Shown | null = null;
let last: Shown | null = null;
const subs = new Set<() => void>();
const set = (v: Shown | null) => {
  shown = v;
  if (v) last = v;
  subs.forEach((f) => f());
};
const subscribe = (f: () => void) => {
  subs.add(f);
  return () => subs.delete(f);
};

export function openPhoto(p: Shown) {
  set(p);
}

export function PhotoViewer() {
  const cur = useSyncExternalStore(subscribe, () => shown);
  // sem isso o Lenis rola a página por trás do visualizador
  useLenisLock(!!cur);
  // a última foto continua desenhada enquanto o modal anima a saída
  const p = cur ?? last;
  return (
    <Dialog open={!!cur} onOpenChange={(open) => !open && set(null)}>
      <DialogContent className="flex h-[90svh] w-[95vw] max-w-6xl flex-col gap-0 overflow-hidden rounded-[10px] border-foreground bg-background p-0 sm:rounded-[10px]">
        {p && (
          <>
            <div className="flex items-baseline gap-3 border-b border-border py-3.5 pl-5 pr-12 font-mono">
              {p.n && <span className="text-[11px] tracking-[0.08em] text-gold">foto {p.n}</span>}
              <DialogTitle className="text-[15px] font-medium leading-tight tracking-tight">{p.title}</DialogTitle>
            </div>
            <ZoomableImage src={p.src} alt={p.alt} className="min-h-0 flex-1 bg-surface" />
            <DialogDescription className="border-t border-border px-5 py-3 text-[13px] leading-relaxed">{p.caption}</DialogDescription>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ foto */

const ratioStyle = (r: string) => ({ aspectRatio: r.replace("/", " / ") });

/** a moldura da foto, ou o espaço reservado; sem legenda */
export function PhotoFrame({
  info,
  dir,
  alt,
  className,
  fit = "cover",
  fallback,
}: {
  info: PhotoInfo;
  dir: string;
  alt?: string;
  className?: string;
  fit?: "cover" | "contain";
  /** o que mostrar enquanto a foto não chega (uma prévia digital, por exemplo) */
  fallback?: React.ReactNode;
}) {
  if (info.src) {
    const src = `${dir}/${info.src}`;
    const text = alt ?? info.caption;
    return (
      <button
        type="button"
        onClick={() => openPhoto({ src, alt: text, title: info.title, caption: info.caption, n: info.n })}
        className={cn(
          "group relative block w-full overflow-hidden rounded-lg border border-border bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
          className,
        )}
        style={ratioStyle(info.ratio)}
        aria-label={`Ampliar: ${info.title}`}
      >
        <img src={src} alt={text} loading="lazy" decoding="async" className={cn("h-full w-full transition-transform duration-500 group-hover:scale-[1.02]", fit === "cover" ? "object-cover" : "object-contain")} />
        <span className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-md bg-background/90 text-foreground opacity-0 shadow-soft-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <Maximize2 className="h-4 w-4" aria-hidden />
        </span>
      </button>
    );
  }
  if (fallback) return <>{fallback}</>;
  return (
    <div
      className={cn(
        "relative flex w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border border-dashed border-foreground/20 bg-surface text-center",
        "[background-image:repeating-linear-gradient(135deg,hsl(var(--border)/.5)_0_1px,transparent_1px_11px)]",
        className,
      )}
      style={ratioStyle(info.ratio)}
      role="img"
      aria-label={`Espaço para a foto: ${info.title} (em breve)`}
    >
      <span className="absolute left-3 top-2.5 font-mono text-[11px] tracking-[0.08em] text-gold">foto {info.n}</span>
      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background shadow-soft-sm">
        <Camera className="h-5 w-5 text-muted-foreground" aria-hidden />
      </span>
      <span className="px-4 text-[13.5px] font-medium leading-snug text-foreground">{info.title}</span>
      <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">foto em breve</span>
    </div>
  );
}

/** foto com legenda, para o meio dos capítulos */
export function Photo({ info, dir, className, alt }: { info: PhotoInfo; dir: string; className?: string; alt?: string }) {
  return (
    <figure className={cn("min-w-0", className)}>
      <PhotoFrame info={info} dir={dir} alt={alt} />
      <figcaption className="mt-2.5 flex gap-2 text-[13px] leading-snug text-muted-foreground">
        <span className="shrink-0 font-mono text-[11px] leading-[1.6] text-gold">{info.n}</span>
        <span>{info.caption}</span>
      </figcaption>
    </figure>
  );
}

/** duas (ou mais) fotos lado a lado no desktop, uma embaixo da outra no celular */
export function PhotoRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid gap-5 sm:grid-cols-2", className)}>{children}</div>;
}
