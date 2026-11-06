/**
 * O G-code do programa atual, sob demanda: a listagem numerada (com a linha que
 * rodava quando a pessoa abriu), os números do programa e o download.
 *
 * Antes era um terminal fixo no painel, rolando a cada passo. Tirado da tela,
 * o simulador respira — e quem quer ver o código vê tudo, não só cinco linhas.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useLenisLock } from "@/components/motion/useLenisLock";
import { formatDuration, gcodeFile, inkLength, type Cmd } from "./machine";

const nf = new Intl.NumberFormat("pt-BR");

type Props = {
  open: boolean;
  onClose: () => void;
  label: string;
  file: string;
  cmds: Cmd[];
  /** índice do comando que estava rodando */
  current: number;
  /** duração do programa a 1× */
  seconds: number;
};

export default function GcodeDialog({ open, onClose, label, file, cmds, current, seconds }: Props) {
  useLenisLock(open);
  const list = useRef<HTMLOListElement>(null);
  const [copied, setCopied] = useState(false);
  const text = useMemo(() => gcodeFile(cmds), [cmds]);
  const ink = useMemo(() => inkLength(cmds), [cmds]);
  const pad = String(cmds.length).length;

  // abre já na linha que estava rodando, no meio da caixa
  useEffect(() => {
    if (!open) return;
    setCopied(false);
    const id = requestAnimationFrame(() => {
      const box = list.current;
      const row = box?.children[current] as HTMLElement | undefined;
      if (box && row) box.scrollTop = row.offsetTop - box.clientHeight / 2 + row.offsetHeight / 2;
    });
    return () => cancelAnimationFrame(id);
  }, [open, current]);

  const download = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    a.download = file;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* sem permissão de área de transferência: o download continua ali */
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-h-[min(88svh,760px)] max-w-2xl flex-col gap-0 overflow-hidden rounded-[10px] border-foreground bg-background p-0 sm:rounded-[10px]">
        <div className="border-b border-border py-3.5 pl-5 pr-12">
          <DialogTitle className="font-mono text-[15px] font-medium leading-tight tracking-tight">G-code</DialogTitle>
          <DialogDescription className="mt-1 font-mono text-[11.5px] leading-relaxed">
            {label} · {nf.format(cmds.length)} linhas · ~{formatDuration(seconds)} a 1× · {(ink / 1000).toFixed(2).replace(".", ",")} m de tinta
          </DialogDescription>
        </div>

        <ol
          ref={list}
          data-lenis-prevent
          aria-label="Linhas do programa"
          className="min-h-0 flex-1 overflow-auto overscroll-contain bg-foreground py-2 font-mono text-[11.5px] leading-[1.65] text-[#d8dbe0]"
        >
          {cmds.map((c, i) => (
            <li key={i} className={i === current && current > 0 ? "bg-white/10 text-gold-soft" : undefined}>
              <span className="inline-block select-none px-3 text-right opacity-40" style={{ minWidth: `${pad + 3}ch` }}>
                {i + 1}
              </span>
              <span className="whitespace-pre pr-4">{c.g}</span>
            </li>
          ))}
        </ol>

        <div className="flex flex-wrap items-center gap-2 border-t border-border px-5 py-3.5">
          <button
            type="button"
            onClick={download}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 font-mono text-[12.5px] font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            <Download className="h-4 w-4" />
            Baixar {file}
          </button>
          <button
            type="button"
            onClick={copy}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-3 font-mono text-[12px] text-foreground transition-colors hover:border-foreground"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copiado" : "Copiar"}
          </button>
          <p className="basis-full text-[11.5px] leading-relaxed text-muted-foreground sm:ml-auto sm:basis-auto sm:text-right">
            G0 vai com a caneta no ar, G1 desenha. M3 e M5 descem e sobem a caneta.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
