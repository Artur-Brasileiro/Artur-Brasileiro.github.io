/**
 * Texto dos guias: as strings em src/data entendem duas marcações, para não
 * precisar de JSX nos dados: `código` e **destaque**.
 */
import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** `código` vira <code>, **texto** vira destaque; o resto passa como está */
export function fmt(text: ReactNode): ReactNode {
  if (typeof text !== "string" || !/[`*]/.test(text)) return text;
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("`") && p.endsWith("`") && p.length > 1)
      return (
        // código curto não quebra; fórmula longa quebra, senão vaza da tela do celular
        <code
          key={i}
          className={cn(
            "rounded-[4px] border border-border bg-surface px-1 py-px font-mono text-[0.86em] text-foreground [box-decoration-break:clone]",
            p.length > 24 ? "break-words" : "whitespace-nowrap",
          )}
        >
          {p.slice(1, -1)}
        </code>
      );
    if (p.startsWith("**") && p.endsWith("**") && p.length > 4)
      return (
        <b key={i} className="font-semibold text-foreground">
          {p.slice(2, -2)}
        </b>
      );
    return <Fragment key={i}>{p}</Fragment>;
  });
}
