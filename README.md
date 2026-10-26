# Site da Iara (iara.family)

Página de apresentação da Iara, separada do app. É HTML, CSS e JS puros, sem build e sem
nenhum serviço de fora: as letras (Fraunces e Rethink Sans) e as imagens ficam nesta pasta,
e não há contador de visitas nem cookies.

Páginas, todas em inglês (o site nasce em inglês, decidido pela Yasmim em 23/10/2026):

- `index.html`: o início, com os passos do app, a árvore, segurança, soberania e perguntas.
- `historia.html`: a história da Yasmim, os Créditos do app, a família e as fotos.
- `seguranca.html`: como a Iara protege os dados e o que ainda não faz. Só escreva ali o que o
  app faz de verdade; o que ainda não existe vai na parte "What Iara does not do yet".
- `soberania.html`: soberania digital e as empresas envolvidas.

Arquivos de apoio:

- `textos-pt.js`: os mesmos textos em português, para o botão PT do topo. Cada chave é o
  `data-t` de um elemento. Ao mudar um texto, mude nos dois.
- `estilo.css`: visual, com as mesmas cores e letras do app.
- `comum.js`: idioma e menu do celular, em todas as páginas.
- `magia.js`: efeitos do início (paralaxe, luz em suspensão, memórias entrando no baú, árvore
  que se desenha, texto que acende). `pagina.js` faz o mesmo, mais simples, nas outras páginas.
- `profundo.js`: em todas as páginas, as partes escuras abrem como painel, os títulos sobem
  por trás de uma máscara, os cartões emergem, as fotos andam na moldura e a régua do canto
  mostra onde se está. Telas do app em `imagens/telas/<nome>-en.webp` e `-pt.webp`, tiradas
  do canvas; a imagem troca junto com o idioma (`data-src-pt`).
  Quem pede menos movimento no celular vê tudo parado.

Para ver no computador:

```sh
cd site && python3 -m http.server 8787
```

A lista de espera manda o e-mail para `https://app.iara.family/api/espera`, que guarda na
tabela `iara.waitlist` e avisa o `SUPORTE_EMAIL`. Para ver a lista: `select * from iara.waitlist order by created_at`.

Falta antes de publicar: apontar iara.family para a hospedagem.
