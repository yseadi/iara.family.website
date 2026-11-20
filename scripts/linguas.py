#!/usr/bin/env python3
"""Gera os endereços por língua do site: en/, pt/, fr/ e ar/.

As páginas da raiz (index.html, story.html, terms.html...) são a fonte e ficam em inglês.
Para cada língua, este script faz uma cópia de cada página na pasta da língua, com o título,
a descrição e a prévia de compartilhamento (WhatsApp, e-mail) já na língua, e com os links
apontando para a mesma língua. O texto do corpo continua vindo de textos-*.js (comum.js).

Também gera as páginas dos nomes antigos (historia.html, termos.html...), que levam para o
endereço novo sem perder a língua (?idioma=ar) nem o trecho (#...), para que os links já
mandados continuem funcionando.

Uso (na raiz do repositório):
  python3 scripts/linguas.py             gera tudo de novo
  python3 scripts/linguas.py --conferir  só confere se as cópias estão em dia (sai com erro se não)

Rode sempre depois de mudar uma página da raiz ou um textos-*.js.
"""
import html
import json
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SITE = "https://iara.family"

# Fonte → nome no endereço (igual em todas as línguas)
PAGINAS = {
    "index.html": "",
    "story.html": "story",
    "security.html": "security",
    "sovereignty.html": "sovereignty",
    "terms.html": "terms",
    "privacy.html": "privacy",
    "governance.html": "governance",
}
# Nomes antigos que já foram mandados por aí
ANTIGOS = {
    "historia": "story",
    "seguranca": "security",
    "soberania": "sovereignty",
    "termos": "terms",
    "privacidade": "privacy",
    "governanca": "governance",
}
LINGUAS = {
    "en": {"lang": "en", "dir": None, "textos": None},
    "pt": {"lang": "pt-BR", "dir": None, "textos": "textos-pt.js"},
    "fr": {"lang": "fr", "dir": None, "textos": "textos-fr.js"},
    "ar": {"lang": "ar", "dir": "rtl", "textos": "textos-ar.js"},
}
AVISO = "<!-- Gerado por scripts/linguas.py a partir de {fonte}. Não edite aqui: mude a página da raiz e rode o script de novo. -->"


def le_textos(arquivo):
    s = (RAIZ / arquivo).read_text(encoding="utf-8")
    return json.loads(s[s.index("{"): s.rindex("}") + 1])


def endereco(lingua, pagina):
    return f"/{lingua}/{pagina}" if lingua else f"/{pagina}"


def alternativas(pagina, proprio):
    """canonical + hreflang: a mesma página em cada língua; x-default é o endereço sem língua."""
    linhas = [f'  <link rel="canonical" href="{SITE}{proprio}">']
    for codigo, l in LINGUAS.items():
        linhas.append(f'  <link rel="alternate" hreflang="{l["lang"]}" href="{SITE}{endereco(codigo, pagina)}">')
    linhas.append(f'  <link rel="alternate" hreflang="x-default" href="{SITE}{endereco(None, pagina)}">')
    return "  <!-- linguas -->\n" + "\n".join(linhas) + "\n  <!-- /linguas -->\n"


def poe_alternativas(s, pagina, proprio):
    s = re.sub(r"  <!-- linguas -->\n.*?  <!-- /linguas -->\n", "", s, flags=re.S)
    return s.replace("  <link rel=\"icon\"", alternativas(pagina, proprio) + "  <link rel=\"icon\"", 1)


def meta(s, atributo, valor):
    padrao = re.compile(r'(<meta (?:name|property)="%s" content=")[^"]*(")' % re.escape(atributo))
    assert padrao.search(s), atributo
    return padrao.sub(lambda m: m.group(1) + html.escape(valor, quote=True) + m.group(2), s, count=1)


def copia(fonte, pagina, codigo, textos):
    s = (RAIZ / fonte).read_text(encoding="utf-8")
    l = LINGUAS[codigo]
    chave_titulo = (re.search(r'data-titulo="([^"]+)"', s) or [None, "titulo"])[1]
    chave_descricao = chave_titulo.replace("titulo", "descricao")
    titulo_en = html.unescape(re.search(r"<title>(.*?)</title>", s).group(1))
    descricao_en = html.unescape(re.search(r'<meta name="description" content="([^"]*)"', s).group(1))
    titulo = textos.get(chave_titulo, titulo_en) if textos else titulo_en
    descricao = textos.get(chave_descricao, descricao_en) if textos else descricao_en
    proprio = endereco(codigo, pagina)

    s = s.replace("<!doctype html>\n", "<!doctype html>\n" + AVISO.format(fonte=fonte) + "\n", 1)
    s = re.sub(r'<html lang="en"', f'<html lang="{l["lang"]}"' + (f' dir="{l["dir"]}"' if l["dir"] else ""), s, count=1)
    s = re.sub(r"<title>.*?</title>", lambda m: f"<title>{html.escape(titulo, quote=False)}</title>", s, count=1)
    s = meta(s, "description", descricao)
    s = meta(s, "og:title", titulo)
    s = meta(s, "og:description", descricao)
    s = meta(s, "og:url", SITE + proprio)
    s = poe_alternativas(s, pagina, proprio)
    # Links entre as páginas: ficam na mesma língua
    nomes = "|".join(sorted({p for p in PAGINAS.values() if p}, key=len, reverse=True))
    s = re.sub(r'href="/(%s)?(#[^"]*)?"' % nomes, lambda m: f'href="/{codigo}/{m.group(1) or ""}{m.group(2) or ""}"', s)
    return s


def antigo(nome, pagina):
    """Página de um nome antigo: leva ao endereço novo, com a língua de ?idioma= e o trecho."""
    return f"""<!doctype html>
{AVISO.format(fonte="scripts/linguas.py")}
<html lang="en" data-destino="{pagina}">
<head>
  <meta charset="utf-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; base-uri 'self'; object-src 'none'">
  <meta name="referrer" content="no-referrer">
  <meta name="robots" content="noindex">
  <title>Iara</title>
  <link rel="canonical" href="{SITE}/{pagina}">
  <script src="/redireciona.js"></script>
  <meta http-equiv="refresh" content="0; url=/{pagina}">
</head>
<body>
  <p><a href="/{pagina}">iara.family/{pagina}</a></p>
</body>
</html>
"""


def gera():
    arquivos = {}
    for codigo, l in LINGUAS.items():
        textos = le_textos(l["textos"]) if l["textos"] else None
        for fonte, pagina in PAGINAS.items():
            destino = f"{codigo}/{pagina or 'index'}.html"
            arquivos[destino] = copia(fonte, pagina, codigo, textos)
    # A raiz também ganha o canonical e as línguas
    for fonte, pagina in PAGINAS.items():
        arquivos[fonte] = poe_alternativas((RAIZ / fonte).read_text(encoding="utf-8"), pagina, endereco(None, pagina))
    for nome, pagina in ANTIGOS.items():
        arquivos[f"{nome}.html"] = antigo(nome, pagina)
    return arquivos


def main():
    conferir = "--conferir" in sys.argv
    diferentes = []
    for caminho, conteudo in gera().items():
        alvo = RAIZ / caminho
        atual = alvo.read_text(encoding="utf-8") if alvo.exists() else None
        if atual == conteudo:
            continue
        diferentes.append(caminho)
        if not conferir:
            alvo.parent.mkdir(parents=True, exist_ok=True)
            alvo.write_text(conteudo, encoding="utf-8")
    if conferir and diferentes:
        print("Páginas por língua desatualizadas. Rode: python3 scripts/linguas.py")
        print("\n".join("  " + d for d in diferentes))
        sys.exit(1)
    print(("Desatualizadas: " if conferir else "Geradas: ") + str(len(diferentes)) if diferentes else "Tudo em dia.")


if __name__ == "__main__":
    main()
