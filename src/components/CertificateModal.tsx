import { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useLenisLock } from "./motion/useLenisLock";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Caminho relativo dentro de /public. */
  image: string;
  title: string;
}

/**
 * Certificado em tela, no papel da prancheta. No Radix Dialog: o foco entra no
 * modal, o Tab fica preso nele, Esc fecha e o foco volta para a linha clicada.
 */
const CertificateModal = ({ isOpen, onClose, image, title }: Props) => {
  const [errored, setErrored] = useState(false);

  // Trava o scroll de fundo (Lenis) enquanto o certificado está aberto.
  useLenisLock(isOpen);

  // Reseta o estado de erro sempre que a imagem mudar (modal reaproveitado).
  useEffect(() => {
    setErrored(false);
  }, [image]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden rounded-[10px] border-foreground bg-background p-0 sm:rounded-[10px]">
        <div className="border-b border-border py-3.5 pl-5 pr-12 font-mono">
          <p className="text-[10px] uppercase tracking-[0.16em] text-gold">certificado</p>
          <DialogTitle className="mt-0.5 text-[15px] font-medium leading-tight tracking-normal">{title}</DialogTitle>
          <DialogDescription className="sr-only">Imagem do certificado de {title}.</DialogDescription>
        </div>

        <div className="bg-surface p-5">
          {errored ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-[6px] border border-dashed border-border bg-background py-16 text-muted-foreground">
              <ImageOff className="h-7 w-7" />
              <span className="text-sm">Imagem do certificado indisponível.</span>
            </div>
          ) : (
            image && (
              <img
                src={`${import.meta.env.BASE_URL}${image}`}
                alt={`Certificado: ${title}`}
                onError={() => setErrored(true)}
                className="w-full rounded-[6px] border border-border bg-background"
              />
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CertificateModal;
