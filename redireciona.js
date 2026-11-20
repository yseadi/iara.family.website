// Páginas com nome antigo (historia.html, termos.html...): levam ao endereço novo sem perder a língua do link
// (?idioma=ar vira /ar/story) nem o trecho da página (#...). Sem JavaScript, o meta refresh leva ao endereço sem língua.
(() => {
  const pagina = document.documentElement.dataset.destino || "";
  const idioma = new URLSearchParams(location.search).get("idioma");
  const lingua = ["en", "pt", "fr", "ar"].includes(idioma) ? `/${idioma}/` : "/";
  location.replace(lingua + pagina + location.hash);
})();
