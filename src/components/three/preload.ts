/**
 * Pré-carga da vista explodida. Sem ela a carga era uma fila: o parts.json só
 * saía depois do primeiro render da página, o three só depois do parts.json, e
 * o GLB só depois do three avaliado (num celular médio, ~18 s até o modelo).
 * Agora os três saem juntos, assim que o módulo da página é avaliado.
 *
 * Fica fora do ExplodedView para o fast refresh dele seguir funcionando
 * (arquivo de componente só exporta componente).
 */
import type { PartsConfig } from "./explode";

/** o chunk do three; o mesmo import do lazy do ExplodedView, então baixa uma vez só */
export const loadCanvas = () => import("./ExplodedCanvas");

const configs = new Map<string, Promise<PartsConfig>>();

/** parts.json, buscado uma vez e reaproveitado por quem montar depois */
export function loadConfig(url: string): Promise<PartsConfig> {
  let p = configs.get(url);
  if (!p) {
    p = fetch(url).then((r) => {
      if (!r.ok) throw new Error(`${r.status} ${url}`);
      return r.json() as Promise<PartsConfig>;
    });
    // uma falha não fica guardada: a próxima montagem tenta de novo
    p.catch(() => configs.delete(url));
    configs.set(url, p);
  }
  return p;
}

const preloaded = new Set<string>();

/**
 * Começa a baixar tudo que a vista explodida de `configUrl` vai pedir: o chunk
 * do three, o parts.json e, assim que ele chega, o modelo. O modelo vai num
 * `<link rel=preload as=fetch>` com `crossorigin` anônimo — o mesmo modo e as
 * mesmas credenciais do fetch do GLTFLoader, então o navegador entrega a
 * resposta pré-carregada em vez de baixar de novo.
 */
export function preloadExplodedView(configUrl: string) {
  if (typeof document === "undefined") return;
  loadCanvas().catch(() => {}); // a falha de verdade aparece no lazy, com o boundary
  loadConfig(configUrl)
    .then((cfg) => {
      const href = configUrl.replace(/[^/]*$/, "") + cfg.model;
      if (preloaded.has(href)) return;
      preloaded.add(href);
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "fetch";
      link.crossOrigin = "anonymous";
      link.href = href;
      document.head.appendChild(link);
    })
    .catch(() => {});
}
