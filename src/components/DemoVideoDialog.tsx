import { useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useLenisLock } from "@/components/motion/useLenisLock";

export type DemoVideo = {
  title: string;
  youtubeId: string;
  /** referência do projeto, no cabeçalho (ex.: HW-01) */
  code?: string;
  summary?: string;
  github?: string;
};

/**
 * Demonstração em vídeo de um projeto, no papel da prancheta. Usado pelos cards
 * de hardware da home e pela página /hardware. O iframe só existe enquanto o
 * modal está aberto — fechar para o vídeo.
 */
const DemoVideoDialog = ({ video, onClose }: { video: DemoVideo | null; onClose: () => void }) => {
  // sem isso o Lenis rola a página por trás do modal
  useLenisLock(!!video);
  const box = useRef<HTMLDivElement>(null);

  return (
    <Dialog open={!!video} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        ref={box}
        // O Radix foca o primeiro elemento focável — aqui, o iframe do YouTube.
        // Com o foco dentro do iframe o Esc não chega à página e o modal não
        // fecha; focar o próprio modal mantém o Esc, e o Tab ainda leva ao player.
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          box.current?.focus();
        }}
        className="max-w-4xl gap-0 overflow-hidden rounded-[10px] border-foreground bg-background p-0 outline-none sm:rounded-[10px]"
      >
        {video && (
          <>
            <div className="flex items-baseline gap-3 border-b border-border py-3.5 pl-5 pr-12 font-mono">
              {video.code && <span className="text-[11px] tracking-[0.08em] text-gold">{video.code}</span>}
              <DialogTitle className="text-[15px] font-medium leading-tight tracking-tight">{video.title}</DialogTitle>
            </div>
            <div className="aspect-video w-full bg-black">
              <iframe
                className="h-full w-full"
                src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0`}
                title={`Demonstração: ${video.title}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between md:gap-8">
              <DialogDescription className="line-clamp-2 max-w-[72ch] text-[13px] leading-relaxed">
                {video.summary ?? "Demonstração do projeto funcionando."}
              </DialogDescription>
              {video.github && (
                <a
                  href={video.github}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 rounded-[7px] border border-foreground px-4 py-2.5 font-mono text-[12px] transition-colors hover:bg-foreground hover:text-background"
                >
                  código no github ↗
                </a>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DemoVideoDialog;
