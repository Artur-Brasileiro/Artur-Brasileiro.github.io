import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Stage, Html, useProgress } from '@react-three/drei';
import { Component, Suspense, useMemo, useRef, useState, useEffect, type ReactNode } from 'react';
import { useReducedMotion } from 'framer-motion';
import { Loader2, Box } from 'lucide-react';
import { useStudioEnvironment } from '@/components/three/studio';

/**
 * Resolve o caminho do modelo contra a base do site.
 * Sem isso, uma URL relativa como "macropadpage/placa.glb" é resolvida
 * contra a rota atual (/projeto/macropad -> /projeto/macropadpage/...), o
 * servidor responde o index.html do fallback SPA e o GLTFLoader estoura.
 */
const resolveAssetUrl = (url: string) =>
  /^(https?:)?\/\//.test(url) || url.startsWith('/') ? url : `${import.meta.env.BASE_URL}${url}`;

function CanvasLoader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2 rounded-md border border-border bg-background/90 p-3 text-primary shadow-soft-md backdrop-blur-sm">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="tabular text-xs font-semibold">{progress.toFixed(0)}%</span>
      </div>
    </Html>
  );
}

function Model({ url }: { url: string }) {
  // os GLBs do macropad vêm com meshopt; o useGLTF do drei já decodifica
  const { scene } = useGLTF(url);
  // O memo garante que a cena só é clonada quando a URL realmente mudar
  const copiedScene = useMemo(() => scene.clone(), [scene]);
  return <primitive object={copiedScene} />;
}

/**
 * O mesmo estúdio da vista explodida da home. O preset "city" do Stage baixava
 * um HDR de um CDN de terceiros a cada visita e passava pelo pré-filtro GGX do
 * three, que só para compilar travava ~1,9 s no Windows — por canvas.
 */
function Studio() {
  useStudioEnvironment('light');
  return null;
}

// Garante ao menos um frame desenhado quando frameloop="demand"
// (ex.: após o modelo carregar ou ao voltar à viewport).
function FrameNudge() {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    invalidate();
  });
  return null;
}

/**
 * Isola a falha do WebGL/GLTF. Sem esta fronteira, um modelo que não carrega
 * propaga a exceção pela árvore inteira e derruba a página toda.
 */
class ModelErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('ModelViewer: falha ao renderizar o modelo 3D.', error);
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-surface text-muted-foreground">
          <Box className="h-6 w-6" />
          <span className="px-4 text-center text-xs">
            Não foi possível carregar o modelo 3D.
          </span>
        </div>
      );
    }
    return this.props.children;
  }
}

const maxDpr = typeof window !== 'undefined' ? Math.min(2, window.devicePixelRatio) : 2;

export default function ModelViewer({
  url,
  enableZoom = false,
  enableRotate = true,
}: {
  url: string;
  enableZoom?: boolean;
  enableRotate?: boolean;
}) {
  const reduce = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const resolvedUrl = resolveAssetUrl(url);

  // Pausa o canvas quando fora da viewport (economia de GPU/bateria).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      threshold: 0.1,
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const isInteractive = enableZoom || enableRotate;
  // Auto-rotação só com movimento permitido, visível e sem reduced-motion.
  const autoRotate = enableRotate && !reduce && visible;

  return (
    <div
      ref={containerRef}
      className={`h-full w-full bg-surface ${
        isInteractive ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'
      }`}
    >
      <ModelErrorBoundary>
        <Canvas
          // a direção da câmera é a que o enquadramento do Stage mantém:
          // de frente, por cima, a ~35°, como se a peça estivesse na bancada
          camera={{ position: [70, 80, 120], fov: 35 }}
          dpr={[1, maxDpr]}
          frameloop={autoRotate ? 'always' : 'demand'}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
        >
          <Studio />
          <Suspense fallback={<CanvasLoader />}>
            <Stage
              environment={null}
              intensity={0.35}
              shadows={{ type: 'contact', opacity: 0.35, blur: 2.5 }}
              adjustCamera={enableZoom ? 1.15 : 1.05}
            >
              <Model url={resolvedUrl} />
            </Stage>
            <FrameNudge />
          </Suspense>

          <OrbitControls
            autoRotate={autoRotate}
            autoRotateSpeed={1.6}
            enableZoom={enableZoom}
            enablePan={enableZoom}
            enableRotate={enableRotate}
            makeDefault
          />
        </Canvas>
      </ModelErrorBoundary>
    </div>
  );
}
