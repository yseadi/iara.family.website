// Profundidade, em todas as páginas: as partes escuras abrem como um painel que chega à borda,
// os títulos sobem linha por linha de trás de uma máscara, os cartões emergem do fundo,
// as fotos andam dentro da moldura e uma régua fina no canto mostra onde se está na página.
// Quem pede menos movimento vê tudo parado e já no lugar.
(() => {
  const calmo = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const limita = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  let vh = innerHeight;

  // Títulos: cada palavra numa máscara, para subir quando o título entra na tela
  const titulos = $$("main h2");
  const parte = (h) => {
    let i = 0;
    const textos = [];
    const w = document.createTreeWalker(h, NodeFilter.SHOW_TEXT);
    while (w.nextNode()) textos.push(w.currentNode);
    for (const t of textos) {
      if (t.parentElement.closest(".pm")) continue;
      const frag = document.createDocumentFragment();
      for (const pedaco of t.textContent.split(/(\s+)/)) {
        if (!pedaco) continue;
        if (/^\s+$/.test(pedaco)) { frag.append(pedaco); continue; }
        const fora = document.createElement("span");
        fora.className = "pm";
        const dentro = document.createElement("span");
        dentro.style.setProperty("--i", i++);
        dentro.textContent = pedaco;
        fora.append(dentro);
        frag.append(fora);
      }
      t.replaceWith(frag);
    }
    h.classList.add("mascara");
  };
  const abre = new IntersectionObserver((itens) => itens.forEach((it) => {
    if (it.isIntersecting) { it.target.classList.add("aberto"); abre.unobserve(it.target); }
  }), { rootMargin: "0px 0px -12% 0px" });
  if (!calmo) {
    titulos.forEach((h) => { parte(h); abre.observe(h); });
    document.addEventListener("idioma", () => titulos.forEach(parte));
  }

  // Cartões e itens de lista emergem do fundo, um depois do outro
  $$(".cabe-lista, .cuidado-lista, .pilares-lista, .instalar, .simbolos-lista, .pedido").forEach((grupo) =>
    [...grupo.children].forEach((filho, i) => {
      filho.classList.add("emerge");
      if (!filho.classList.contains("revelar")) filho.classList.add("revelar");
      filho.style.setProperty("--atraso", `${i * 0.11}s`);
    }));

  // Partes escuras depois de uma clara: começam como um painel com cantos e abrem até a borda
  const paineis = $$(".claro + .escuro");
  paineis.forEach((p) => p.classList.add("painel"));

  // Entre duas partes claras: uma linha dourada que se desenha a partir do centro
  const linhas = new IntersectionObserver((itens) => itens.forEach((it) => {
    if (it.isIntersecting) { it.target.classList.add("visivel"); linhas.unobserve(it.target); }
  }), { rootMargin: "0px 0px -15% 0px" });
  $$("main > .claro + .claro").forEach((s) => {
    const d = document.createElement("span");
    d.className = "divisor";
    d.setAttribute("aria-hidden", "true");
    s.prepend(d);
    linhas.observe(d);
  });

  // Fotos com moldura: a imagem anda um pouco dentro dela
  const molduras = $$(".moldura img");

  // A régua da profundidade: um traço por parte da página, com o nome da parte onde se está
  const partes = $$("main > section").map((s) => {
    const nome = s.querySelector(".rotulo, .capitulo-numero + h2, h2, h1");
    return nome ? { s, nome } : null;
  }).filter(Boolean);
  const regua = document.createElement("nav");
  regua.className = "regua";
  regua.setAttribute("aria-hidden", "true");
  const fio = document.createElement("span");
  fio.className = "regua-fio";
  const nivel = document.createElement("span");
  nivel.className = "regua-nivel";
  const legenda = document.createElement("span");
  legenda.className = "regua-legenda";
  regua.append(fio, nivel, legenda);
  const marcas = partes.map(() => { const m = document.createElement("i"); regua.append(m); return m; });
  document.body.append(regua);

  let atual = -1, quieto;
  const nomeDe = (p) => p.nome.textContent.replace(/\s+/g, " ").trim();
  const posiciona = () => {
    const total = document.documentElement.scrollHeight - vh;
    partes.forEach((p, i) => { marcas[i].style.top = `${limita(p.s.offsetTop / total) * 100}%`; });
  };
  posiciona();
  addEventListener("load", posiciona);
  addEventListener("resize", () => { vh = innerHeight; posiciona(); });
  document.addEventListener("idioma", () => { if (atual >= 0) legenda.textContent = nomeDe(partes[atual]); });

  let ultimoY = -1;
  const quadro = () => {
    const y = scrollY;
    if (y !== ultimoY) {
      ultimoY = y;
      const total = document.documentElement.scrollHeight - vh;
      const pr = limita(y / total);
      nivel.style.top = `${pr * 100}%`;
      fio.style.setProperty("--pr", pr);
      let i = -1;
      partes.forEach((p, k) => { if (p.s.getBoundingClientRect().top <= vh * 0.5) i = k; });
      if (i !== atual) {
        atual = i;
        marcas.forEach((m, k) => m.classList.toggle("passou", k <= i));
        legenda.textContent = i >= 0 ? nomeDe(partes[i]) : "";
        legenda.style.top = `${i >= 0 ? parseFloat(marcas[i].style.top) : 0}%`;
      }
      const meio = $$("[data-tema]").findLast((s) => s.getBoundingClientRect().top <= vh * 0.5);
      regua.classList.toggle("no-claro", meio?.dataset.tema === "claro");
      regua.classList.add("andando");
      clearTimeout(quieto);
      quieto = setTimeout(() => regua.classList.remove("andando"), 1400);

      if (!calmo) {
        for (const p of paineis) {
          const r = p.getBoundingClientRect();
          if (r.top > vh || r.bottom < 0) continue;
          p.style.setProperty("--fecha", (1 - limita((vh - r.top) / (vh * 0.75))).toFixed(3));
        }
        for (const img of molduras) {
          const r = img.parentElement.getBoundingClientRect();
          if (r.bottom < 0 || r.top > vh) continue;
          img.style.setProperty("--dentro", `${((r.top + r.height / 2 - vh / 2) / vh) * -6}%`);
        }
      }
    }
    requestAnimationFrame(quadro);
  };
  requestAnimationFrame(quadro);
})();
