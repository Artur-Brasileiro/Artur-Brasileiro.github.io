import { createRoot } from "react-dom/client";
import { redirectToPreferredLocale } from "./i18n/detect";
import App from "./App.tsx";
import "./index.css";

// antes do roteador ler o endereço: quem não fala português vai para /en
redirectToPreferredLocale();

createRoot(document.getElementById("root")!).render(<App />);
