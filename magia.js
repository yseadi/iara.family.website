// Efeitos da página: paralaxe, luz em suspensão, memórias entrando no baú, árvore que se desenha.
// Quem pede menos movimento no celular vê tudo parado e já no lugar.
(() => {
  const calmo = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fino = matchMedia("(pointer: fine)").matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const limita = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const suave = (a, b, v) => { const t = limita((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  let vh = innerHeight, vw = innerWidth;

  // Quebra o texto em palavras, para aparecerem ou acenderem uma a uma
  const quebra = (el) => {
    const palavras = el.textContent.trim().split(/\s+/);
    el.innerHTML = palavras.map((p, i) => `<span class="p" style="--i:${i}">${p}</span>`).join(" ");
    return $$(".p", el);
  };
  const acende = $$("[data-acende]").map((el) => ({ el, palavras: [] }));
  const quebraTudo = () => {
    $$("[data-palavras]").forEach(quebra);
    acende.forEach((a) => { a.palavras = quebra(a.el); });
  };

  // O texto chega no idioma escolhido (comum.js); a cada troca, as palavras são quebradas de novo
  quebraTudo();
  document.addEventListener("idioma", quebraTudo);

  // Aparecer ao descer, com um pequeno atraso entre irmãos
  $$(".cabe-lista, .cuidado-lista, .instalar").forEach((lista) =>
    [...lista.children].forEach((filho, i) => filho.style.setProperty("--atraso", `${i * 0.09}s`)));
  const vistos = new IntersectionObserver((itens) => itens.forEach((it) => {
    if (it.isIntersecting) { it.target.classList.add("visivel"); vistos.unobserve(it.target); }
  }), { rootMargin: "0px 0px -12% 0px" });
  $$(".revelar").forEach((el) => vistos.observe(el));

  // Lista de espera: o e-mail vai para o app, que guarda e avisa quem cuida da Iara
  const espera = $("[data-espera]");
  espera?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const botao = $("button", espera), ok = $(".espera-ok", espera), erro = $(".espera-erro", espera);
    ok.hidden = erro.hidden = true;
    botao.disabled = true;
    try {
      const dados = Object.fromEntries(new FormData(espera));
      const res = await fetch(espera.action, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(dados) });
      if (!res.ok) throw new Error(res.status);
      ok.hidden = false;
      espera.reset();
    } catch {
      erro.hidden = false;
    } finally {
      botao.disabled = false;
    }
  });

  // Passos do "Como funciona": o celular troca de tela quando o texto do passo chega
  const telas = $$("[data-tela]");
  const passos = $$("[data-passo]");
  let passoAtual = null;
  const trocaPasso = () => {
    const linha = innerHeight * (innerWidth <= 820 ? 0.8 : 0.55);
    let atual = passos[0];
    for (const p of passos) if (p.firstElementChild.getBoundingClientRect().top < linha) atual = p;
    if (atual === passoAtual) return;
    passoAtual = atual;
    passos.forEach((p) => p.classList.toggle("ativo", p === atual));
    telas.forEach((t) => t.classList.toggle("ativa", t.dataset.tela === atual.dataset.passo));
  };
  trocaPasso();
  addEventListener("scroll", trocaPasso, { passive: true });

  if (calmo) return;

  // Partículas de luz em suspensão, raras e lentas, como poeira na água
  const tela = $("[data-plancton]");
  const ctx = tela.getContext("2d");
  let pontos = [], dedo = { x: -999, y: -999 }, aberturaVisivel = true;
  const prepara = () => {
    const r = Math.min(devicePixelRatio || 1, 2);
    tela.width = tela.offsetWidth * r; tela.height = tela.offsetHeight * r;
    ctx.setTransform(r, 0, 0, r, 0, 0);
    const n = Math.round((tela.offsetWidth * tela.offsetHeight) / 26000);
    pontos = Array.from({ length: n }, () => ({
      x: Math.random() * tela.offsetWidth, y: Math.random() * tela.offsetHeight,
      r: 0.4 + Math.random() * 1.1, v: 0.06 + Math.random() * 0.18, f: Math.random() * 6.28,
      dourado: Math.random() < 0.85, vx: 0, vy: 0,
    }));
  };
  const desenha = (t) => {
    if (aberturaVisivel) {
      const w = tela.offsetWidth, h = tela.offsetHeight;
      ctx.clearRect(0, 0, w, h);
      for (const p of pontos) {
        const dx = p.x - dedo.x, dy = p.y - dedo.y, d2 = dx * dx + dy * dy;
        if (d2 < 14000) { const d = Math.sqrt(d2) || 1; p.vx += (dx / d) * 0.12; p.vy += (dy / d) * 0.12; }
        p.vx *= 0.94; p.vy *= 0.94;
        p.x += p.vx + Math.sin(t / 1600 + p.f) * 0.18;
        p.y += p.vy - p.v;
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        const brilho = 0.4 + 0.6 * Math.abs(Math.sin(t / 2400 + p.f));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.28);
        ctx.fillStyle = p.dourado ? `rgba(242,212,141,${brilho * 0.55})` : `rgba(180,240,228,${brilho * 0.35})`;
        ctx.shadowBlur = 4; ctx.shadowColor = p.dourado ? "rgba(242,212,141,.9)" : "rgba(150,225,215,.9)";
        ctx.fill();
      }
    }
    requestAnimationFrame(desenha);
  };
  prepara();
  requestAnimationFrame(desenha);
  addEventListener("pointermove", (e) => {
    const r = tela.getBoundingClientRect();
    dedo = { x: e.clientX - r.left, y: e.clientY - r.top };
  }, { passive: true });

  // Luz que segue o mouse nas partes escuras
  const lanterna = $("[data-lanterna]");
  if (fino) addEventListener("pointermove", (e) => {
    lanterna.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    const sob = document.elementFromPoint(e.clientX, e.clientY)?.closest("[data-tema]");
    lanterna.classList.toggle("acesa", sob?.dataset.tema === "escuro");
  }, { passive: true });

  // O celular do "Como funciona" acompanha o mouse bem de leve
  if (fino) {
    const celular = $("[data-celular]");
    $(".como").addEventListener("pointermove", (e) => {
      celular.style.setProperty("--ry", `${(e.clientX / vw - 0.5) * 6}deg`);
      celular.style.setProperty("--rx", `${-(e.clientY / vh - 0.5) * 4}deg`);
    });
  }

  // Tudo o que depende da rolagem, num quadro só
  const topo = $("[data-topo]");
  const mergulho = $("[data-mergulho]");
  const abertura = $(".abertura");
  const paralaxe = $$("[data-paralaxe]").map((el) => ({ el, v: +el.dataset.paralaxe, secao: el.closest("section") }));
  const cenaBau = $("[data-cena-bau]").parentElement;
  const bauCentro = $(".bau-centro");
  const voam = $$("[data-voa]").map((el, i) => {
    const [dx, dy] = el.dataset.voa.split(",").map(Number);
    return { el, dx, dy, i };
  });
  const cenaArvore = $("[data-cena-arvore]");
  const linhas = $$(".arvore-linhas path", cenaArvore);
  const nos = $$(".no, .uniao", cenaArvore);
  // Quatro gerações, uma a cada 27,5% da altura do desenho
  const nivelDo = (el) => Math.round((parseFloat(el.style.getPropertyValue("--y")) - 8.75) / 27.5);
  const chave = $("[data-chave]");
  const temas = $$("[data-tema]");

  const quadro = (t) => {
    const y = scrollY;

    // Topo: vidro depois de descer, e a cor certa para o fundo de baixo dele
    topo.classList.toggle("vidro", y > 40);
    const sob = temas.findLast((s) => { const r = s.getBoundingClientRect(); return r.top <= 40 && r.bottom > 40; });
    topo.classList.toggle("claro-topo", sob?.dataset.tema === "claro");

    // Abertura: o conteúdo afunda e desfoca, como quem mergulha
    const pa = limita(y / (abertura.offsetHeight * 0.8));
    aberturaVisivel = pa < 1;
    mergulho.style.transform = `translateY(${y * 0.38}px) scale(${1 - pa * 0.06})`;
    mergulho.style.opacity = 1 - pa * 1.2;
    mergulho.style.filter = `blur(${pa * 8}px)`;

    for (const p of paralaxe) {
      const r = p.secao.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) continue;
      p.el.style.transform = `translate3d(0, ${-r.top * p.v}px, 0)`;
    }

    // Baú: as memórias vêm de longe e entram, uma de cada vez
    const rb = cenaBau.getBoundingClientRect();
    const pb = limita(-rb.top / (rb.height - vh));
    const raioY = Math.min(vh * (vw <= 820 ? 0.19 : 0.3), 380);
    let brilho = 0;
    for (const m of voam) {
      const inicio = 0.08 + m.i * 0.13, fim = inicio + 0.42;
      const q = suave(inicio, fim, pb);
      const raioX = Math.min(400, (vw / 2 - m.el.offsetWidth / 2 - 8) / Math.abs(m.dx));
      const x = m.dx * raioX * (1 - q);
      const yy = m.dy * raioY * (1 - q) - q * 20;
      const escala = 1 - q * 0.7;
      m.el.style.transform = `translate(${x}px, ${yy}px) scale(${escala})`;
      m.el.style.opacity = q > 0.92 ? 0 : 1 - suave(0.75, 0.92, q);
      brilho = Math.max(brilho, 1 - Math.abs(q - 0.95) * 6);
    }
    bauCentro.style.setProperty("--brilho", limita(Math.max(brilho, suave(0.85, 1, pb) * 0.7)));

    // Árvore: cada geração se desenha depois da anterior
    const ra = cenaArvore.getBoundingClientRect();
    const pr = limita((vh * 0.85 - ra.top) / (ra.height * 0.75));
    linhas.forEach((l, i) => l.style.setProperty("--linha", limita(pr * 4.6 - i * 1.05 - 0.25)));
    nos.forEach((n) => {
      const nivel = nivelDo(n);
      n.style.setProperty("--s", suave(0, 1, pr * 4.6 - nivel * 1.05 + (nivel ? 0 : 0.6)));
      if (n.dataset.profundidade) n.style.setProperty("--dy", `${(pr - 0.5) * -50 * n.dataset.profundidade}px`);
    });

    // Chave: gira um pouco conforme a página desce
    const rc = chave.getBoundingClientRect();
    chave.style.setProperty("--giro", `${-34 + limita(1 - rc.top / vh) * 40}deg`);

    // Texto da Iara: acende palavra por palavra enquanto é lido
    for (const a of acende) {
      const r = a.el.getBoundingClientRect();
      const p = limita((vh * 0.78 - r.top) / (r.height + vh * 0.2));
      const n = Math.round(p * a.palavras.length);
      a.palavras.forEach((w, i) => w.classList.toggle("lida", i < n));
    }

    requestAnimationFrame(quadro);
  };
  requestAnimationFrame(quadro);

  addEventListener("resize", () => { vh = innerHeight; vw = innerWidth; prepara(); });
})();
