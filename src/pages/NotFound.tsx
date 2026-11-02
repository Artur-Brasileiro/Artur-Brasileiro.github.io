import { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 pt-14">
      <div className="w-full max-w-md text-center">
        <p className="eyebrow">Erro 404</p>

        <h1 className="font-display mt-4 text-display-lg font-medium">Página não encontrada</h1>

        <p className="mt-4 leading-relaxed text-muted-foreground">
          O endereço <span className="font-mono text-sm text-foreground">{location.pathname}</span>{" "}
          não corresponde a nenhuma página deste site.
        </p>

        <Link
          to="/"
          className="mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow-soft-sm transition-colors hover:bg-primary-hover"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para a página inicial
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
