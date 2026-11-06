/**
 * Botões para baixar o instalador do Polpad direto do GitHub.
 *
 * Os links usam "releases/latest/download/<arquivo>", que o GitHub redireciona
 * sempre para a versão mais nova: o site não precisa mudar a cada release. A
 * versão e o tamanho vêm da API do GitHub quando ela responde; sem ela, os
 * botões funcionam igual, só sem esses números.
 *
 * O botão do sistema de quem visita vem primeiro e cheio; o outro, contornado.
 * No celular (e no Mac, que o app ainda não tem) os dois aparecem iguais.
 */
import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { macropad, POLPAD_REPO, type Installer } from "@/data/projects";
import { cn } from "@/lib/utils";

type Release = { version: string; date: string; sizes: Record<string, number> };

const CACHE = "polpad-release";

/** a última versão publicada; uma consulta por sessão (a API sem token aceita 60 por hora) */
function useLatestRelease(): Release | null {
  const [rel, setRel] = useState<Release | null>(() => {
    try {
      const v = sessionStorage.getItem(CACHE);
      return v ? (JSON.parse(v) as Release) : null;
    } catch {
      return null;
    }
  });
  useEffect(() => {
    if (rel) return;
    const ctrl = new AbortController();
    fetch(`https://api.github.com/repos/${POLPAD_REPO}/releases/latest`, { signal: ctrl.signal, headers: { Accept: "application/vnd.github+json" } })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j: { tag_name: string; published_at: string; assets: { name: string; size: number }[] }) => {
        const v: Release = { version: j.tag_name, date: j.published_at, sizes: Object.fromEntries(j.assets.map((a) => [a.name, a.size])) };
        setRel(v);
        try {
          sessionStorage.setItem(CACHE, JSON.stringify(v));
        } catch {
          /* sem armazenamento, consulta de novo na próxima visita */
        }
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [rel]);
  return rel;
}

function detectOS(): Installer["os"] | null {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent;
  if (/Android|iPhone|iPad|iPod|Mobile/i.test(ua)) return null;
  if (/Windows/i.test(ua)) return "windows";
  if (/Linux|X11|CrOS/i.test(ua)) return "linux";
  return null;
}

const mb = (bytes: number) => `${Math.round(bytes / 1e6)} MB`;
const date = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" });

export default function PolpadDownloads({ compact = false, className }: { compact?: boolean; className?: string }) {
  const rel = useLatestRelease();
  const [os, setOs] = useState<Installer["os"] | null>(null);
  useEffect(() => setOs(detectOS()), []);

  const list = [...macropad.installers].sort((a, b) => Number(b.os === os) - Number(a.os === os));

  return (
    <div className={className}>
      <div className={cn("flex flex-wrap gap-3", compact && "gap-2")}>
        {list.map((it) => {
          const primary = os ? it.os === os : true;
          const size = rel?.sizes[it.asset];
          return (
            <a
              key={it.os}
              href={it.url}
              // o GitHub entrega o arquivo como anexo; o atributo é só uma dica
              download
              rel="noopener"
              className={cn(
                "relative z-10 inline-flex items-center gap-2.5 rounded-md text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                compact ? "h-9 px-3 text-xs font-medium" : "min-h-[52px] px-4 py-2",
                primary && !compact
                  ? "bg-primary text-primary-foreground shadow-soft-sm hover:bg-primary-hover"
                  : "border border-border bg-background text-foreground hover:border-primary/40 hover:text-primary",
              )}
            >
              <Download className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} aria-hidden />
              {compact ? (
                <span>{it.os === "windows" ? "Windows" : "Linux"}</span>
              ) : (
                <span className="flex flex-col leading-tight">
                  <span className="text-sm font-medium">{it.label}</span>
                  <span className={cn("text-[11.5px]", primary ? "opacity-80" : "text-muted-foreground")}>
                    {it.detail}
                    {size ? ` · ${mb(size)}` : ""}
                  </span>
                </span>
              )}
            </a>
          );
        })}
      </div>
      {!compact && (
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          {rel ? (
            <>
              Versão <span className="font-mono text-foreground">{rel.version}</span>, de {date(rel.date)}.{" "}
            </>
          ) : (
            "Sempre a versão mais nova. "
          )}
          O app avisa e se atualiza sozinho.{" "}
          <a href={macropad.releases} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-primary">
            Notas de versão e firmware
          </a>
          {os === null && <> · O app roda no Windows e no Linux.</>}
        </p>
      )}
    </div>
  );
}
