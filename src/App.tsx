import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Suspense, lazy } from "react";
import { ThemeProvider } from "next-themes";

// 1. Substituímos o PageTransition pelo novo PageWrapper
import PageWrapper from "./components/PageWrapper";
// 2. Importamos a Navbar
import Navbar from "./components/Navbar";
import SmoothScroll, { scrollToTop } from "./components/motion/SmoothScroll";
import { stripLocale } from "./i18n/core";
import { LocaleProvider } from "./i18n/react";

// Lazy loading das páginas
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ProjectsPage = lazy(() => import("./pages/ProjectsPage"));
const MacropadPage = lazy(() => import("./pages/projetos-destaque/MacropadPage"));
const CncPage = lazy(() => import("./pages/projetos-destaque/CncPage"));
const PenduloPage = lazy(() => import("./pages/projetos-destaque/PenduloPage"));

const PageLoader = () => <div className="min-h-screen bg-background w-full" />;

const queryClient = new QueryClient();

/** As páginas do site; cada uma existe na raiz (português) e sob /en (inglês). */
const pages: { path: string; Page: React.ComponentType }[] = [
  { path: "", Page: Index },
  { path: ":category", Page: ProjectsPage },
  { path: "projeto/macropad", Page: MacropadPage },
  // o nome novo do projeto também abre a página
  { path: "projeto/polpad", Page: MacropadPage },
  { path: "projeto/cnc-plotter", Page: CncPage },
  { path: "projeto/pendulo-invertido", Page: PenduloPage },
  { path: "*", Page: NotFound },
];

const page = (Page: React.ComponentType) => (
  <Suspense fallback={<PageLoader />}>
    <PageWrapper>
      <Page />
    </PageWrapper>
  </Suspense>
);

const AnimatedRoutes = () => {
  const location = useLocation();

  // A chave ignora o idioma: trocar de PT para EN não remonta a página nem volta
  // ao topo, só troca os textos. Mudar de página continua com a transição.
  return (
    // 3. Adicionamos onExitComplete para voltar ao topo na troca de página
    <AnimatePresence mode="wait" onExitComplete={() => scrollToTop(true)}>
      <Routes location={location} key={stripLocale(location.pathname)}>
        {["/", "/en/"].flatMap((base) =>
          pages.map(({ path, Page }) => <Route key={base + path} path={base + path} element={page(Page)} />),
        )}
      </Routes>
    </AnimatePresence>
  );
};

// O site tem um único tema (claro). O ThemeProvider permanece porque
// ui/sonner.tsx consome useTheme(); forcedTheme trava a escolha.
const App = () => (
  <ThemeProvider attribute="class" forcedTheme="light" enableSystem={false} disableTransitionOnChange>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SmoothScroll>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <LocaleProvider>
              {/* 4. A Navbar fica aqui para aparecer por cima de todas as rotas */}
              <Navbar />
              <AnimatedRoutes />
            </LocaleProvider>
          </BrowserRouter>
        </SmoothScroll>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;