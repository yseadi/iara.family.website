// Partes de todas as páginas: o idioma (o site nasce em inglês e o botão do topo troca para português,
// lembrando a escolha) e o menu do celular. Depois de cada troca de idioma avisa com o evento "idioma".
(() => {
  const $$ = (s) => [...document.querySelectorAll(s)];
  // Cada página nova começa do topo, a não ser que o link aponte para um trecho
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  // (scrollIntoView sobe também a página de fora, quando o site abre dentro de outra)
  const topo = () => {
    if (location.hash) return;
    scrollTo({ top: 0, behavior: "instant" });
    try { document.documentElement.scrollIntoView({ block: "start", behavior: "instant" }); } catch {}
  };
  topo();
  addEventListener("load", topo, { once: true });
  addEventListener("pageshow", (e) => { if (e.persisted) { document.documentElement.classList.remove("saindo", "carregando", "carregou"); topo(); } });

  // Entre as páginas do site: o fundo da abertura cobre a tela e as ondas do tridente se desenham
  // enquanto a próxima página carrega. Na chegada, a tela some quando o tridente termina de se desenhar
  const raiz = document.documentElement;
  const calmo = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (raiz.classList.contains("carregando")) {
    const inicio = performance.now();
    const libera = () => setTimeout(() => {
      raiz.classList.add("carregou");
      setTimeout(() => raiz.classList.remove("carregando", "carregou"), 700);
    }, Math.max(0, 1300 - (performance.now() - inicio)));
    if (document.readyState === "complete") libera(); else addEventListener("load", libera, { once: true });
  }
  if (!calmo) {
    document.addEventListener("click", (e) => {
      const a = e.target.closest("a[href]");
      if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return;
      e.preventDefault();
      try { sessionStorage.setItem("iara-troca", "1"); } catch {}
      raiz.classList.remove("carregando", "carregou");
      raiz.classList.add("saindo");
      setTimeout(() => { location.href = url.href; }, 650);
    });
  }
  const ATRIBUTOS = ["aria-label", "alt", "placeholder"];
  const chaveTitulo = document.documentElement.dataset.titulo || "titulo";
  const ingles = { [chaveTitulo]: document.title };
  $$("[data-t]").forEach((el) => { ingles[el.dataset.t] ??= el.innerHTML; });
  for (const at of ATRIBUTOS) $$(`[data-t-${at}]`).forEach((el) => { ingles[el.getAttribute(`data-t-${at}`)] = el.getAttribute(at); });
  // Imagens com versão em português (as telas do app): data-src-pt guarda a outra
  $$("[data-src-pt]").forEach((el) => { el.dataset.srcEn = el.getAttribute("src"); });
  const botao = document.querySelector("[data-idioma]");
  const aplica = (idioma) => {
    const textos = idioma === "pt" ? window.TEXTOS_PT : ingles;
    $$("[data-t]").forEach((el) => { el.innerHTML = textos[el.dataset.t]; });
    for (const at of ATRIBUTOS) $$(`[data-t-${at}]`).forEach((el) => el.setAttribute(at, textos[el.getAttribute(`data-t-${at}`)]));
    $$("[data-src-pt]").forEach((el) => el.setAttribute("src", idioma === "pt" ? el.dataset.srcPt : el.dataset.srcEn));
    document.title = textos[chaveTitulo];
    document.documentElement.lang = idioma === "pt" ? "pt-BR" : "en";
    botao.textContent = idioma === "pt" ? "EN" : "PT";
    botao.lang = idioma === "pt" ? "en" : "pt";
    botao.setAttribute("aria-label", idioma === "pt" ? "View in English" : "Ver em português");
    document.dispatchEvent(new Event("idioma"));
  };
  let idioma = "en";
  try { idioma = localStorage.getItem("idioma") === "pt" ? "pt" : "en"; } catch {}
  aplica(idioma);
  botao.addEventListener("click", () => {
    idioma = idioma === "pt" ? "en" : "pt";
    try { localStorage.setItem("idioma", idioma); } catch {}
    document.documentElement.classList.add("trocado");
    aplica(idioma);
  });

  // Menu do celular: abre por cima da página e fecha ao escolher um link ou apertar Esc
  const menu = document.querySelector("[data-menu]");
  const abre = document.querySelector("[data-menu-botao]");
  const deixa = (aberto) => {
    document.documentElement.classList.toggle("menu-aberto", aberto);
    abre?.setAttribute("aria-expanded", String(aberto));
  };
  abre?.addEventListener("click", () => deixa(abre.getAttribute("aria-expanded") !== "true"));
  menu?.addEventListener("click", (e) => { if (e.target.closest("a")) deixa(false); });
  addEventListener("keydown", (e) => { if (e.key === "Escape") deixa(false); });
})();
