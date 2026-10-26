// Páginas de dentro (história, segurança, soberania): aparece ao descer, as fotos andam um pouco mais devagar que o texto.
// Quem pede menos movimento vê tudo parado e já no lugar.
(() => {
  const calmo = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const limita = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  let vh = innerHeight, vw = innerWidth;

  $$(".mural .coluna, .mae-fotos").forEach((grupo) =>
    [...grupo.children].forEach((filho, i) => filho.style.setProperty("--atraso", `${i * 0.12}s`)));
  const vistos = new IntersectionObserver((itens) => itens.forEach((it) => {
    if (it.isIntersecting) { it.target.classList.add("visivel"); vistos.unobserve(it.target); }
  }), { rootMargin: "0px 0px -10% 0px" });
  $$(".revelar").forEach((el) => vistos.observe(el));

  // A sigla: Artificial se desfaz letra por letra e Ancestral se forma no lugar, conforme a página desce.
  // O A de cada palavra e o I de Inteligência ficam, em dourado
  const letras = (txt, cls) => `<span class="${cls}">${[...txt].map((c, i) => `<i${i === 0 ? ' class="inicial"' : ""}>${c}</i>`).join("")}</span>`;
  const sigla = $("[data-sigla]");
  const trocas = $$(".sigla-palavra").map((el) => {
    el.innerHTML = letras(el.dataset.de, "de") + letras(el.dataset.para, "para");
    return { de: $$(".de i", el), para: $$(".para i", el) };
  });
  const marcaInicial = () => $$(".sigla-fixa").forEach((f) => { if (!f.querySelector(".inicial")) f.innerHTML = `<span class="inicial">${f.textContent[0]}</span>${f.textContent.slice(1)}`; });
  marcaInicial();
  const legendaDe = $(".sigla-de"), legendaPara = $(".sigla-para");
  const suave = (a, b, v) => { const t = limita((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  const desenhaSigla = (p) => {
    for (const t of trocas) {
      t.de.forEach((l, i) => {
        // O A fica: é a mesma letra nas duas palavras
        const q = i === 0 ? suave(0.5, 0.62, p) : suave(0.12 + i * 0.035, 0.3 + i * 0.035, p);
        l.style.opacity = 1 - q;
        l.style.transform = `translateY(${-0.45 * q}em) rotate(${(i % 2 ? 1 : -1) * 8 * q}deg)`;
        l.style.filter = `blur(${q * 10}px)`;
      });
      t.para.forEach((l, i) => {
        const q = i === 0 ? suave(0.5, 0.62, p) : suave(0.46 + i * 0.035, 0.64 + i * 0.035, p);
        l.style.opacity = q;
        l.style.transform = `translateY(${0.45 * (1 - q)}em)`;
        l.style.filter = `blur(${(1 - q) * 10}px)`;
      });
    }
    legendaDe.style.opacity = 1 - suave(0.28, 0.42, p);
    legendaPara.style.opacity = suave(0.7, 0.86, p);
    sigla.style.setProperty("--sp", p);
  };
  if (sigla && calmo) desenhaSigla(1);

  // Assinaturas: cada traço da letra se desenha em ordem, como a mão escrevendo, e revela o desenho de verdade
  const escreve = new IntersectionObserver((itens) => itens.forEach((it) => {
    if (!it.isIntersecting) return;
    escreve.unobserve(it.target);
    let atraso = 0.1;
    const tracos = $$("mask path", it.target);
    const total = tracos.reduce((t, p) => t + p.getTotalLength(), 0);
    const velocidade = total / 0.95;
    for (const p of tracos) {
      const dura = p.getTotalLength() / velocidade;
      p.style.transition = `stroke-dashoffset ${dura.toFixed(3)}s linear ${atraso.toFixed(3)}s`;
      p.style.strokeDashoffset = "0";
      atraso += dura + 0.015;
    }
    // No fim, o desenho inteiro fica à mostra, sem depender dos traços
    setTimeout(() => $$("[mask]", it.target).forEach((g) => g.removeAttribute("mask")), (atraso + 0.1) * 1000);
  }), { rootMargin: "0px 0px -18% 0px" });
  $$(".tracado").forEach((svg) => {
    if (calmo) return;
    $$("mask path", svg).forEach((p) => { const l = p.getTotalLength() + 2; p.style.strokeDasharray = l; p.style.strokeDashoffset = l; });
    escreve.observe(svg);
  });

  document.addEventListener("idioma", () => { marcaInicial(); });

  const topo = $("[data-topo]");
  const temas = $$("[data-tema]");
  const mergulho = $("[data-mergulho]");
  const abertura = $(".pagina-abertura");
  const paralaxe = $$("[data-paralaxe]").map((el) => ({ el, v: +el.dataset.paralaxe, secao: el.closest("section") }));

  const quadro = () => {
    const y = scrollY;
    topo.classList.toggle("vidro", y > 40);
    const sob = temas.findLast((s) => { const r = s.getBoundingClientRect(); return r.top <= 40 && r.bottom > 40; });
    topo.classList.toggle("claro-topo", sob?.dataset.tema === "claro");
    if (sigla && !calmo) {
      const r = sigla.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) desenhaSigla(limita(-r.top / (r.height - vh)));
    }
    if (!calmo) {
      const pa = limita(y / (abertura.offsetHeight * 0.8));
      mergulho.style.transform = `translateY(${y * 0.3}px)`;
      mergulho.style.opacity = 1 - pa;
      // translate, e não transform, para não brigar com o aparecer ao descer. No celular as colunas viram uma grade só, sem paralaxe
      for (const p of paralaxe) {
        if (vw <= 820 && (p.el.classList.contains("coluna") || p.el.closest(".mae-fotos"))) { p.el.style.translate = ""; continue; }
        const r = p.secao.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) continue;
        p.el.style.translate = `0 ${(vh / 2 - r.top - r.height / 2) * -p.v}px`;
      }
    }
    requestAnimationFrame(quadro);
  };
  requestAnimationFrame(quadro);
  addEventListener("resize", () => { vh = innerHeight; vw = innerWidth; });
})();
