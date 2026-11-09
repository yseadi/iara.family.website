// Partes de todas as páginas: o idioma (o site nasce em inglês e o botão do topo abre a lista com inglês,
// português, francês e árabe, lembrando a escolha; em árabe a página corre da direita para a esquerda) e o menu do celular. Depois de cada troca de idioma avisa com o evento "idioma".
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
  // Imagens com versão em outra língua (as telas do app): data-src-pt, data-src-fr, data-src-ar guardam as outras
  $$("img[data-src-pt], img[data-src-fr], img[data-src-ar]").forEach((el) => { el.dataset.srcEn = el.getAttribute("src"); });
  const IDIOMAS = {
    en: { nome: "English", sigla: "EN", lang: "en", textos: () => ingles },
    pt: { nome: "Português", sigla: "PT", lang: "pt-BR", textos: () => window.TEXTOS_PT },
    fr: { nome: "Français", sigla: "FR", lang: "fr", textos: () => window.TEXTOS_FR },
    ar: { nome: "العربية", sigla: "ع", lang: "ar", dir: "rtl", textos: () => window.TEXTOS_AR },
  };
  const ROTULO = { en: "Language", pt: "Idioma", fr: "Langue", ar: "اللغة" };
  const botao = document.querySelector("[data-idioma]");
  // A lista das quatro línguas abre logo abaixo do botão do topo; cada nome aparece na própria língua
  const lista = document.createElement("ul");
  lista.className = "idiomas";
  lista.id = "idiomas";
  lista.hidden = true;
  lista.setAttribute("role", "menu");
  for (const [codigo, i] of Object.entries(IDIOMAS)) {
    const li = document.createElement("li");
    li.setAttribute("role", "none");
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("role", "menuitemradio");
    b.lang = i.lang;
    if (i.dir) b.dir = i.dir;
    b.dataset.codigo = codigo;
    b.textContent = i.nome;
    li.append(b);
    lista.append(li);
  }
  const caixa = document.createElement("div");
  caixa.className = "caixa-idiomas";
  botao.before(caixa);
  caixa.append(botao, lista);
  botao.removeAttribute("lang");
  botao.setAttribute("aria-haspopup", "menu");
  botao.setAttribute("aria-controls", "idiomas");
  botao.setAttribute("aria-expanded", "false");
  const abreLista = (aberta) => {
    lista.hidden = !aberta;
    botao.setAttribute("aria-expanded", String(aberta));
    if (aberta) lista.querySelector("[aria-checked=true]")?.focus();
  };
  const aplica = (idioma) => {
    const i = IDIOMAS[idioma];
    // Chave que faltar numa língua fica em inglês, para nunca aparecer vazio
    const textos = i.textos() || ingles;
    const pega = (k) => textos[k] ?? ingles[k];
    $$("[data-t]").forEach((el) => { el.innerHTML = pega(el.dataset.t); });
    for (const at of ATRIBUTOS) $$(`[data-t-${at}]`).forEach((el) => el.setAttribute(at, pega(el.getAttribute(`data-t-${at}`))));
    const chaveSrc = "src" + idioma[0].toUpperCase() + idioma.slice(1);
    $$("img[data-src-en]").forEach((el) => el.setAttribute("src", el.dataset[chaveSrc] || el.dataset.srcEn));
    document.title = pega(chaveTitulo);
    document.documentElement.lang = i.lang;
    document.documentElement.dir = i.dir || "ltr";
    botao.textContent = i.sigla;
    botao.setAttribute("aria-label", `${ROTULO[idioma]}: ${i.nome}`);
    lista.setAttribute("aria-label", ROTULO[idioma]);
    lista.querySelectorAll("button").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.codigo === idioma)));
    document.dispatchEvent(new Event("idioma"));
  };
  // A língua vem do link (?idioma=fr), depois da última escolha; sem nada, o site abre em inglês
  let idioma = "en";
  try { idioma = localStorage.getItem("idioma") || "en"; } catch {}
  const doLink = new URLSearchParams(location.search).get("idioma");
  if (doLink in IDIOMAS) { idioma = doLink; try { localStorage.setItem("idioma", idioma); } catch {} }
  if (!(idioma in IDIOMAS)) idioma = "en";
  aplica(idioma);
  botao.addEventListener("click", () => abreLista(lista.hidden));
  lista.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-codigo]");
    if (!b) return;
    abreLista(false);
    botao.focus();
    if (b.dataset.codigo === idioma) return;
    idioma = b.dataset.codigo;
    try { localStorage.setItem("idioma", idioma); } catch {}
    document.documentElement.classList.add("trocado");
    aplica(idioma);
  });
  lista.addEventListener("keydown", (e) => {
    const itens = [...lista.querySelectorAll("button")];
    const n = itens.indexOf(document.activeElement);
    if (e.key === "ArrowDown") { e.preventDefault(); itens[(n + 1) % itens.length].focus(); }
    if (e.key === "ArrowUp") { e.preventDefault(); itens[(n - 1 + itens.length) % itens.length].focus(); }
    if (e.key === "Escape") { e.stopPropagation(); abreLista(false); botao.focus(); }
    if (e.key === "Tab") abreLista(false);
  });
  document.addEventListener("click", (e) => { if (!lista.hidden && !caixa.contains(e.target)) abreLista(false); });

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
