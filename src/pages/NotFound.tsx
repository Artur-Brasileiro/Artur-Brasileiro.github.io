import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Link, useT } from "@/i18n/react";

const NotFound = () => {
  const location = useLocation();
  const t = useT();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 pt-14">
      <div className="w-full max-w-md text-center">
        <p className="eyebrow">{t("Erro 404", "Error 404")}</p>

        <h1 className="font-display mt-4 text-display-lg font-medium">{t("Página não encontrada", "Page not found")}</h1>

        <p className="mt-4 leading-relaxed text-muted-foreground">
          {t("O endereço", "The address")} <span className="font-mono text-sm text-foreground">{location.pathname}</span>{" "}
          {t("não corresponde a nenhuma página deste site.", "doesn't match any page on this site.")}
        </p>

        <Link
          to="/"
          className="mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow-soft-sm transition-colors hover:bg-primary-hover"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("Voltar para a página inicial", "Back to the home page")}
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
