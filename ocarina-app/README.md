# 🎵 Ocarina Hero

App irmão do [Violão Hero](../README.md): em vez de tentar achar as notas de uma música em algum site, você
**canta ou toca a melodia perto do microfone e o app descobre as notas sozinho**, depois mostra o dedilhado
numa ocarina de 12 furos para você praticar.

100% front-end (Web Audio API + `<canvas>`/SVG), funciona como PWA — dá para instalar na tela inicial do
Android pelo Chrome (⋮ → "Adicionar à tela inicial") e usar offline depois da primeira visita.

## Funcionalidades

- **Gravar melodia** — grava pelo microfone, segmenta o áudio em notas (usando o mesmo detector de pitch por
  autocorrelação do Violão Hero, que funciona muito bem aqui porque ocarina e voz são monofônicas: uma nota
  de cada vez) e mostra a sequência encontrada. Se a melodia ficar fora do alcance de uma ocarina de 12
  furos, um botão desloca ela (mantendo os intervalos, só transpõe) para caber.
- **Digitar notas** — já sabe as notas de algum lugar? Monte a sequência clicando nelas, sem precisar do
  microfone.
- **Praticar** — mostra cada nota da música salva com o diagrama de dedilhado (furos cobertos/abertos +
  polegares), um botão para ouvir a nota de referência, e navegação livre entre as notas. Ligando o
  microfone, o app confirma se você tocou a nota certa e avança sozinho.

## Sobre a precisão do dedilhado

A tabela de dedilhado (`src/ocarina/fingering.ts`) é uma **referência genérica** para ocarina de 12 furos
(o modelo "pendant"/dupla-câmara mais comum hoje), não foi verificada contra o encarte de um fabricante
específico — pequenas variações são comuns entre marcas. As notas naturais (dó ré mi fá sol lá si) seguem
um padrão de "abrir os furos progressivamente" bem estabelecido; as notas sustenido/bemol são uma
aproximação (a técnica de meio-furo varia mais). Se algo soar errado no seu instrumento, me diga qual nota
e o dedilhado correto que eu ajusto — é só uma tabela de dados, fácil de corrigir.

## APK nativo (Android real, via Capacitor)

Além da PWA, o projeto tem um app Android nativo de verdade em `android/` (gerado com
[Capacitor](https://capacitorjs.com/) — uma WebView nativa embrulhando o mesmo app web). O ambiente onde
este projeto é desenvolvido não tem Android SDK (o plugin do Gradle para Android só é distribuído via
`dl.google.com`, bloqueado ali), então o `.apk` é compilado automaticamente pelo GitHub Actions a cada push
em `ocarina-app/` — veja `.github/workflows/build-android.yml`.

Para pegar o APK mais recente: aba **Actions** do repositório → workflow **"Build Ocarina Hero Android
APK"** → última execução com ✅ → baixe o artefato **ocarina-hero-debug-apk** (é um .zip contendo o .apk).
Esse é um APK de **debug**, não assinado para a Play Store — dá pra instalar direto no celular habilitando
"instalar de fontes desconhecidas", mas para publicar de verdade seria preciso gerar uma build de release
assinada.

Para compilar localmente (com Android Studio/SDK instalado):

```bash
npm run build           # gera dist/
npx cap sync android    # copia os assets pro projeto nativo
cd android && ./gradlew assembleDebug
```

## Como rodar

```bash
npm install
npm run dev       # desenvolvimento com hot-reload
npm run build     # gera dist/ pronto para publicar (é só hospedar em qualquer HTTPS estático)
npm run preview   # serve a versão de produção localmente
```

O microfone só funciona em `localhost` ou HTTPS.

## Estrutura

```
src/
  audio/        conversão frequência↔nota, detector de pitch (autocorrelação), sintetizador de referência
  ocarina/      tabela de dedilhado (nota -> furos cobertos) para ocarina de 12 furos
  transcribe/   segmenta um fluxo de áudio contínuo em notas discretas + ajuste de transposição
  songs/        músicas salvas (localStorage)
  ui/           telas (menu, gravar, digitar, lista, praticar) e o diagrama SVG da ocarina
```

## Próximos passos possíveis

- Tabelas de dedilhado para ocarina de 4 ou 6 furos (layouts bem diferentes do 12 furos).
- Deixar o usuário corrigir/salvar seu próprio dedilhado, caso o de referência não bata com o instrumento.
- Quantizar o ritmo da melodia gravada (arredondar para semínimas/colcheias) em vez de usar a duração exata.
- Build de release assinada (keystore) para publicar de verdade na Play Store, em vez de só o APK de debug.
