import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImageOff, X } from "lucide-react";
import { useLenisLock } from "./motion/useLenisLock";
import { EASE_OUT_EXPO } from "@/lib/motion";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Caminho relativo dentro de /public. */
  image: string;
  title: string;
}

const CertificateModal = ({ isOpen, onClose, image, title }: Props) => {
  const [errored, setErrored] = useState(false);

  // Trava o scroll de fundo (Lenis) enquanto o certificado está aberto.
  useLenisLock(isOpen);

  // Reseta o estado de erro sempre que a imagem mudar (modal reaproveitado).
  useEffect(() => {
    setErrored(false);
  }, [image]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <motion.div
            className="w-full max-w-2xl overflow-hidden rounded-[10px] border border-foreground bg-background shadow-soft-lg"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-3.5 font-mono">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-gold">certificado</p>
                <h3 className="mt-0.5 text-[15px] font-medium text-foreground">{title}</h3>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar"
                className="-mr-1.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="bg-surface p-5">
              {errored ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border bg-background py-16 text-muted-foreground">
                  <ImageOff className="h-7 w-7" />
                  <span className="text-sm">Imagem do certificado indisponível.</span>
                </div>
              ) : (
                <img
                  src={`${import.meta.env.BASE_URL}${image}`}
                  alt={`Certificado: ${title}`}
                  loading="lazy"
                  onError={() => setErrored(true)}
                  className="w-full rounded-md border border-border bg-background"
                />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CertificateModal;
