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
  // A mesma linha separa os tempos do agradecimento (ancestrais, presentes, descendentes)
  $$("main > .claro + .claro, .legado-bloco + .legado-bloco").forEach((s) => {
    const d = document.createElement("span");
    d.className = "divisor";
    d.setAttribute("aria-hidden", "true");
    s.prepend(d);
    linhas.observe(d);
  });

  // A carta de agradecimento, como o baú da home: o envelope para no meio da tela enquanto a página desce.
  // Primeiro a aba abre e o coração da mãe solta (a carta fica dentro), depois a carta sobe de dentro do envelope
  // e, quando já saiu quase toda, o envelope desce e some e a carta cresce até o tamanho de leitura.
  // Tudo depende só da posição: subindo a página, a carta volta para dentro e o envelope fecha.
  const carta = document.querySelector(".carta");
  if (carta && !calmo) {
    carta.classList.add("anima");
    const marco = carta.querySelector(".carta-marco");
    const cena = carta.querySelector(".envelope-cena");
    const folha = carta.querySelector(".carta-sombra");
    let A = 0, B = 0, C = 0, s0 = 1, topoFixo = 0, H = 0;
    const mede = () => {
      vh = innerHeight;
      H = cena.offsetHeight;
      topoFixo = vh / 2 - H / 2;
      A = vh * 0.35;                              // a aba abre
      B = topoFixo + H * 0.7 - vh * 0.18;         // a carta sobe até perto do topo da tela
      C = vh * 0.35;                              // o envelope sai e a carta cresce
      s0 = Math.min(1, (cena.offsetWidth * 0.92) / folha.offsetWidth);
    };
    const abre = () => {
      const d = topoFixo - marco.getBoundingClientRect().top;   // quanto a página desceu com o envelope parado
      const aba = limita(d / A);
      const sai = limita((d - A - B * 0.75) / C);
      const segura = Math.max(0, Math.min(d, A));
      const escala = s0 + (1 - s0) * sai;
      carta.style.setProperty("--aba", aba.toFixed(3));
      carta.style.setProperty("--sai", sai.toFixed(3));
      carta.style.setProperty("--segura", `${Math.round(segura)}px`);
      carta.style.setProperty("--escala", escala.toFixed(4));
      // o que ainda está dentro do envelope fica escondido (corta na borda de baixo do envelope)
      if (sai >= 1) carta.style.setProperty("--corte", "-60px");
      else {
        const f = folha.getBoundingClientRect();
        const baseEnvelope = cena.getBoundingClientRect().bottom + sai * vh * 0.75;
        const visivel = (baseEnvelope - f.top) / escala;
        carta.style.setProperty("--corte", `${Math.round(folha.offsetHeight - Math.max(0, visivel))}px`);
      }
    };
    addEventListener("scroll", () => requestAnimationFrame(abre), { passive: true });
    addEventListener("resize", () => { mede(); abre(); });
    mede(); abre();
  }

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
