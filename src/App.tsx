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

// Lazy loading das páginas
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ProjectsPage = lazy(() => import("./pages/ProjectsPage"));
const MacropadPage = lazy(() => import("./pages/projetos-destaque/MacropadPage"));
const CncPage = lazy(() => import("./pages/projetos-destaque/CncPage"));
const PenduloPage = lazy(() => import("./pages/projetos-destaque/PenduloPage"));

const PageLoader = () => <div className="min-h-screen bg-background w-full" />;

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    // 3. Adicionamos onExitComplete para voltar ao topo na troca de página
    <AnimatePresence mode="wait" onExitComplete={() => scrollToTop(true)}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Suspense fallback={<PageLoader />}><PageWrapper><Index /></PageWrapper></Suspense>} />
        <Route path="/:category" element={<Suspense fallback={<PageLoader />}><PageWrapper><ProjectsPage /></PageWrapper></Suspense>} />
        <Route path="/projeto/macropad" element={<Suspense fallback={<PageLoader />}><PageWrapper><MacropadPage /></PageWrapper></Suspense>} />
        {/* o nome novo do projeto também abre a página */}
        <Route path="/projeto/polpad" element={<Suspense fallback={<PageLoader />}><PageWrapper><MacropadPage /></PageWrapper></Suspense>} />
        <Route path="/projeto/cnc-plotter" element={<Suspense fallback={<PageLoader />}><PageWrapper><CncPage /></PageWrapper></Suspense>} />
        <Route path="/projeto/pendulo-invertido" element={<Suspense fallback={<PageLoader />}><PageWrapper><PenduloPage /></PageWrapper></Suspense>} />
        <Route path="*" element={<Suspense fallback={<PageLoader />}><PageWrapper><NotFound /></PageWrapper></Suspense>} />
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
            {/* 4. A Navbar fica aqui para aparecer por cima de todas as rotas */}
            <Navbar />
            <AnimatedRoutes />
          </BrowserRouter>
        </SmoothScroll>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;