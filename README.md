# Estudio Jurídico Kruger Johana — site + admin

## 🆕 O que mudou nesta atualização

- **Hero virou slideshow full-bleed** (imagem de ponta a ponta da tela, com transição automática e bolinhas de navegação). Aceita **imagens e vídeos** juntos no mesmo carrossel.
- **Acesso ao admin discreto**: um "adm" pequeno e apagado no rodapé de todas as páginas públicas, linkando pra `/admin/login.html`.
- **Painel admin redesenhado**: sidebar com 4 seções (Hero, Quiénes somos, Blog, Mensajes), visual mais profissional, cards e tabelas.
- **Blog virou dinâmico**: você cria/edita/apaga artigos direto do admin (título, resumo, conteúdo, área, capa em imagem OU vídeo, rascunho/publicado). Cada artigo publicado vira uma página própria em `/blog/post.html?slug=seu-artigo`, com comentários abertos ao público e um cartão de contato via WhatsApp da Dra. Johana.
- **Upload de vídeo**: tanto no Hero quanto na capa dos artigos, dá pra escolher foto ou vídeo — o Cloudinary detecta sozinho (`/auto/upload`).
- **Número de WhatsApp real** já configurado: +54 9 3329 33-0625.
- **Animações de scroll**: títulos, cards e blocos de texto aparecem com um fade + leve deslocamento conforme você rola a página (respeitando configurações de acessibilidade do usuário).
- **Preloader elegante** na home: mostra "Johana Kruger" com uma animação sutil antes do site aparecer.
- **Imagem de "Quiénes somos" corrigida**: a página `/quienes-somos.html` agora também reflete a imagem publicada no admin (antes só a seção da home puxava certo).
- **Mensagens do formulário de contato** agora são salvas no Firestore e aparecem num painel novo em `/admin` (aba "Mensajes"), com opção de marcar como lido e apagar.
- ⚠️ **Se o blog estava dando "sem permissão" ao salvar**: é porque as regras do Firestore no seu console ainda são as antigas. Repita o passo 2.2 abaixo com as regras atualizadas (agora incluem `posts`, `comments` e `contactMessages`).

Site estático (HTML/CSS/JS puro, sem build step) com:
- Design seguindo a UX que você enviou (hero preto/dourado, seções creme, tipografia serifada).
- SEO on-page completo: title/description por página, dados estruturados (Attorney, LegalService x2, Service, FAQPage, BreadcrumbList, Article), sitemap.xml, robots.txt, URLs limpas em espanhol — tudo conforme `Estrategia_SEO_Kruger_Johana.md`.
- Área `/admin` com login (Firebase Auth) pra gerenciar hero, imagem de "Quiénes somos" e o blog, sem mexer em código.


```
/
├── index.html, quienes-somos.html, sobre-mi.html, servicios.html, contacto.html
├── servicios/derecho-penal.html (+ 5 outras áreas)
├── blog/index.html + blog/que-es-la-probation-argentina.html (exemplo)
├── admin/login.html, admin/dashboard.html
├── css/style.css   js/firebase-config.js, site-content.js, main.js
├── assets/  (imagens — as atuais são placeholders, troque pelas fotos reais)
├── sitemap.xml, robots.txt, firestore.rules
```

---

## ⚠️ Sobre o Cloudinary API Secret

Você me mandou o **API Secret** do Cloudinary. Ele **não está em nenhum arquivo deste projeto** — não precisa dele para nada aqui, porque o upload do admin usa um **Upload Preset "unsigned"** (só precisa do Cloud Name + nome do preset, que não são segredos).

Como esse Secret já foi exposto neste chat, o mais seguro é: entre em **Cloudinary → Settings → Security → API Keys** e clique em **Regenerate** no Secret atual. Isso invalida o antigo sem afetar nada do que construímos aqui.

---

## 1. Configurar o Cloudinary (upload preset unsigned)

1. Entre em [cloudinary.com/console](https://cloudinary.com/console) → **Settings → Upload**.
2. Em "Upload presets", clique **Add upload preset**.
3. Configure:
   - **Preset name:** `johana_admin_unsigned` (tem que bater com `CLOUDINARY_UPLOAD_PRESET` em `js/firebase-config.js`)
   - **Signing Mode:** `Unsigned`
   - **Folder:** `johana-kruger` (opcional, o código já manda a subpasta certa)
   - Em "Upload Manipulations", limite formatos para `jpg, png, webp` e um tamanho máximo (ex. 10MB), pra evitar abuso.
4. Salve. Cloud name já está certo no código (`vcpdu2oa`).
5. **Se for subir vídeos** (no Hero ou na capa de artigos): confirme que o preset não tem nenhuma restrição de "Resource type" só pra imagem — o upload usa o endpoint `/auto/upload`, que detecta sozinho se é foto ou vídeo, mas se o preset estiver travado em "Image only" o vídeo vai falhar. Deixe como "Auto" ou sem restrição de tipo.

> Como o preset é "unsigned", tecnicamente qualquer pessoa que descubra o nome do preset poderia tentar subir uma imagem. Isso é seguro o bastante pro uso real (só você vai divulgar/usar essa URL), mas se quiser reforçar, dá pra criar depois uma Cloudinary Upload Widget signature via Vercel Function — me avisa se quiser evoluir pra isso.

## 2. Configurar o Firebase

### 2.1 Authentication
1. [console.firebase.google.com](https://console.firebase.google.com) → projeto **johanaadv-af02e**.
2. **Build → Authentication → Get started → Sign-in method → Email/Password → Enable**.
3. Aba **Users → Add user**: crie o e-mail/senha que a Dra. Johana vai usar para logar em `/admin`.

### 2.2 Firestore
1. **Build → Firestore Database → Create database** (modo produção, região `southamerica-east1` ou a mais próxima).
2. Aba **Rules**, cole o conteúdo de `firestore.rules` (já está neste projeto, atualizado com as regras do blog e dos comentários) e publique. Isso garante que:
   - qualquer visitante pode **ler** o conteúdo do site (hero, about) e os **artigos publicados**,
   - só quem estiver **logado** (você) pode **escrever/editar/apagar** conteúdo e artigos (inclusive rascunhos),
   - qualquer visitante pode **comentar** num artigo (sem precisar de login), mas só você pode editar/apagar um comentário.

Não precisa criar nenhum documento manualmente — o próprio painel admin cria `siteContent/home` e os documentos de `posts/{slug}` na primeira vez que você salvar algo.

## 3. Rodar localmente

Como é tudo estático, é só servir a pasta com qualquer servidor simples:

```bash
npx serve .
# ou
python3 -m http.server 8080
```

Abra `http://localhost:8080` e `http://localhost:8080/admin/login.html`.

## 4. Deploy (GitHub + Vercel)

1. Crie um repositório no GitHub e suba esta pasta:
   ```bash
   git init
   git add .
   git commit -m "Site inicial Kruger Johana"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/kruger-johana-site.git
   git push -u origin main
   ```
2. Em [vercel.com](https://vercel.com) → **Add New → Project** → importe o repositório.
3. Framework preset: **Other** (site estático, sem build command, sem output directory especial — ou deixe em branco).
4. Deploy. A Vercel já te dá uma URL `algo.vercel.app`.
5. Em **Settings → Domains**, adicione o domínio real (ex. `krugerjohana.com.ar`) e siga as instruções de DNS.
6. **No Firebase**, vá em **Authentication → Settings → Authorized domains** e adicione o domínio da Vercel (e o domínio final) — senão o login não funciona em produção.

## 5. Substituir as imagens placeholder

As imagens em `/assets/` (`johana-kruger-hero.jpg`, `estatua-justicia.jpg`, `og-cover.jpg`) são só placeholders escuros pra não quebrar o layout. Depois do deploy:
1. Logue em `/admin/login.html`.
2. Suba a foto real da Dra. Johana como "Imagem do Hero" e uma foto do escritório/balança como "Imagem de Quiénes somos".
3. Elas passam a aparecer automaticamente na home (a troca é lida via Firestore, com fallback pro arquivo estático se algo falhar — isso é bom pro SEO, porque o Google sempre vê uma imagem, mesmo sem JS).
4. Troque também `assets/og-cover.jpg` manualmente pelo arquivo final (é a imagem que aparece ao compartilhar o link no WhatsApp/redes) — esse aqui não passa pelo admin, é só subir o arquivo direto na pasta.

## 6. Ajustes que ainda faltam antes de publicar

- `js/main.js`: troque `WHATSAPP_NUMBER` pelo número real (com código de país, sem "+", ex. `5491122334455`).
- Domínio real: troque `krugerjohana.com.ar` em todas as tags `canonical`, `og:` e nos JSON-LD pelo domínio definitivo, e nos itens do `sitemap.xml`.
- Endereços: os mapas em `contacto.html` usam os endereços do documento de estratégia (Arnaldo 910, San Pedro; Paraná 423, CABA) — confirme se estão certos.
- Google Search Console + Google Analytics 4: crie as contas e adicione os snippets/verificação (posso te ajudar com isso depois do deploy).
- Google Business Profile: seguir a seção 6 da estratégia de SEO (2 perfis, fotos reais, categorias, reviews).
- `contacto.html`: o formulário hoje só mostra uma mensagem de confirmação em tela. Para receber os e-mails de verdade, integre com Firestore (salvar os leads) ou um serviço como Formspree/EmailJS — posso implementar isso também, é só pedir.

## 7. Como funciona o admin, por baixo dos panos

- `admin/login.html` usa **Firebase Auth** (e-mail/senha) — só usuários criados por você no console conseguem entrar.
- `admin/dashboard.html` está protegido: se não há sessão ativa, redireciona pro login.
- Ao escolher uma imagem, ela sobe direto pro **Cloudinary** (upload unsigned, direto do navegador — não passa pelo seu servidor).
- A URL retornada pelo Cloudinary é salva no **Firestore**, no documento `siteContent/home`.
- Todas as páginas públicas (via `js/site-content.js`) leem esse documento ao carregar e trocam a imagem/texto padrão pela versão publicada — se o Firestore estiver fora do ar, a página mostra o conteúdo estático padrão (nunca quebra).
