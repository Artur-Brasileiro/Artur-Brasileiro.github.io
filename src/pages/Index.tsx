import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getLenis } from "@/components/motion/SmoothScroll";
import SheetsHero from "@/components/home/SheetsHero";
import SiteFooter from "@/components/SiteFooter";
import { NAV_OFFSET } from "@/lib/scroll";

const Index = () => {
  const location = useLocation();

  // "Voltar para Projetos" navega para "/" com state.targetId. A transição de página já
  // rolou para o topo ANTES desta página montar, então fazemos o scroll até a seção aqui.
  // Esperamos a ALTURA da página estabilizar antes de rolar — senão o Lenis clampa o alvo
  // na altura ainda incompleta (a home renderiza progressivamente) e a rolagem fica curta.
  useEffect(() => {
    const targetId = (location.state as { targetId?: string } | null)?.targetId;
    if (!targetId) return;
    // Limpa o user-state (sem quebrar o react-router) p/ não repetir o scroll ao recarregar.
    window.history.replaceState({ ...window.history.state, usr: null }, "");

    let raf = 0;
    let tries = 0;
    // Tenta rolar e repete até o alvo realmente chegar ao topo (~NAV_OFFSET). A home renderiza
    // progressivamente e o Lenis pode clampar o alvo numa altura ainda incompleta; repetir
    // por alguns frames faz a posição convergir quando o layout assenta. Limite ~0.6s.
    const tick = () => {
      const el = document.getElementById(targetId);
      if (el) {
        const targetY = el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET;
        const lenis = getLenis();
        if (lenis) lenis.scrollTo(targetY, { immediate: true });
        else window.scrollTo(0, targetY);
        const landed = Math.abs(el.getBoundingClientRect().top - NAV_OFFSET) < 4;
        if (landed) return;
      }
      if (tries++ < 36) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [location.state]);

  return (
    <div className="min-h-screen bg-background">
      <SheetsHero />
      <main />
      <SiteFooter />
    </div>
  );
};

export default Index;
