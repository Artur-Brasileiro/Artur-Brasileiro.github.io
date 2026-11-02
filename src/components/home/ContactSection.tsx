import { useState, type FormEvent } from "react";
import { Check, Copy } from "lucide-react";
import { EMAIL, FORMSPREE_ENDPOINT, GITHUB_URL, LINKEDIN_URL, WHATSAPP, WHATSAPP_URL } from "@/data/profile";
import SectionLabel from "./SectionLabel";

const field =
  "w-full rounded-[6px] border border-input bg-background px-3 font-sans text-sm text-foreground transition-colors placeholder:text-muted-foreground focus:border-foreground focus:ring-2 focus:ring-gold-soft/40 focus-visible:outline-none";
const label = "mb-2 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground";

type Status = "idle" | "loading" | "success" | "error";

/** 04 · contato — os canais diretos em linhas grandes e, abaixo, o formulário. */
const ContactSection = () => {
  const [status, setStatus] = useState<Status>("idle");
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // área de transferência indisponível — o endereço segue visível na tela
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setStatus("loading");
    try {
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error(String(response.status));
      setStatus("success");
      form.reset();
      setTimeout(() => setStatus("idle"), 5000);
    } catch {
      setStatus("error");
    }
  };

  const channels = [
    { k: "e-mail", v: EMAIL, href: `mailto:${EMAIL}`, copy: true },
    { k: "whatsapp", v: WHATSAPP, href: WHATSAPP_URL, external: true },
  ];

  return (
    <section id="contato" className="border-t border-border py-24">
      <SectionLabel n="04">contato</SectionLabel>

      {/* os dois canais diretos, em linhas de tabela como a ficha técnica */}
      <dl className="mt-8 border-b border-border">
        {channels.map((c) => (
          <div key={c.k} className="grid items-baseline gap-2 border-t border-border py-6 md:grid-cols-[140px_1fr] md:gap-6">
            <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-gold">{c.k}</dt>
            <dd className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
              <a
                href={c.href}
                {...(c.external ? { target: "_blank", rel: "noreferrer" } : {})}
                className="break-all font-mono text-[clamp(24px,4vw,56px)] font-medium tracking-[-0.04em] text-foreground underline decoration-gold-soft decoration-1 underline-offset-[10px]"
              >
                {c.v}
              </a>
              {c.copy && (
                <button
                  type="button"
                  onClick={copyEmail}
                  className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span aria-live="polite">{copied ? "copiado" : "copiar"}</span>
                </button>
              )}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-14 grid gap-10 lg:grid-cols-[260px_1fr]">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">ou escreva aqui</p>
          <p className="mt-3 max-w-[30ch] text-[14px] leading-relaxed text-muted-foreground">
            A mensagem chega direto no meu e-mail.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 font-mono text-[12px]">
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="rounded-[7px] border border-border px-4 py-2.5 transition-colors hover:border-foreground">
              github ↗
            </a>
            <a href={LINKEDIN_URL} target="_blank" rel="noreferrer" className="rounded-[7px] border border-border px-4 py-2.5 transition-colors hover:border-foreground">
              linkedin ↗
            </a>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-[8px] border border-border bg-card p-6 md:p-8">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="contato-nome" className={label}>
                nome
              </label>
              <input id="contato-nome" name="name" type="text" required autoComplete="name" className={`${field} h-11`} />
            </div>
            <div>
              <label htmlFor="contato-email" className={label}>
                e-mail
              </label>
              <input id="contato-email" name="email" type="email" required autoComplete="email" className={`${field} h-11`} />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="contato-mensagem" className={label}>
                mensagem
              </label>
              <textarea id="contato-mensagem" name="message" required rows={5} className={`${field} resize-none py-2.5 leading-relaxed`} />
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p aria-live="polite" className="min-h-5 font-mono text-[12px]">
              {status === "success" && <span className="text-success">mensagem enviada — respondo por e-mail.</span>}
              {status === "error" && <span className="text-destructive">não foi possível enviar — escreva direto para o e-mail acima.</span>}
            </p>
            <button
              type="submit"
              disabled={status === "loading"}
              className="shrink-0 rounded-[7px] bg-primary px-5 py-3 font-mono text-[12px] font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-60"
            >
              {status === "loading" ? "enviando…" : "enviar mensagem →"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default ContactSection;
