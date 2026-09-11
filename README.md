# 🎸 Violão Hero

Um jogo estilo Guitar Hero, mas com **notas reais de violão**: em vez de botões
coloridos sem relação com música, as notas que caem na tela correspondem a
cordas e trastes de verdade, e o jogo tenta ouvir seu violão pelo microfone
para conferir se você tocou a nota certa. Também tem um afinador e um modo de
aulas que ensina onde colocar os dedos, com diagramas.

100% front-end, sem servidor: roda inteiro no navegador com Web Audio API +
`<canvas>`.

## Funcionalidades

- **Afinador** — ouve o microfone e mostra a nota detectada, quantos "cents"
  ela está fora do tom, e um ponteiro visual (verde quando afinado).
- **Aulas** — duas sequências guiadas: *Primeiros Passos* (nome das cordas,
  postura, um dedo por traste) e *Seus Primeiros Acordes* (8 acordes abertos
  essenciais). Cada passo mostra um diagrama do braço do violão; nos passos de
  nota única, o app usa o microfone para confirmar que você tocou a nota certa
  antes de avançar automaticamente.
- **Tocar** — o modo "jogo" propriamente dito: notas (ou acordes) caem em 6
  raias, uma por corda (Mi-Lá-Ré-Sol-Si-mi), até uma linha de acerto. Toque a
  corda/traste indicado no seu violão de verdade no tempo certo.
- **Modo teclado** — sem violão ou microfone à mão? As teclas `1`-`6` simulam
  as 6 cordas e `espaço` simula um dedilhado, então dá pra treinar o ritmo
  mesmo assim (ver limitações abaixo).

## O que a detecção de pitch consegue (e o que não consegue)

A pergunta original era "será que dá pra captar pelo menos a nota?" — dá, com
uma ressalva importante:

- **Notas únicas: sim, de verdade.** `src/audio/pitchDetector.ts` implementa
  autocorrelação (uma técnica clássica de detecção de altura/pitch) sobre o
  áudio do microfone em tempo real, convertendo a frequência captada na nota
  musical mais próxima (nome + oitava + desvio em cents). É assim que o
  Afinador funciona, e é assim que o modo "Tocar" confere notas isoladas nos
  exercícios de melodia (ex: *Brilha, Brilha Estrelinha*).
- **Acordes: só uma aproximação.** Detectar automaticamente *quais* das 4-6
  cordas de um acorde realmente soaram (transcrição polifônica) é um
  problema bem mais difícil, fora do escopo de um detector de pitch simples
  rodando no navegador. Por isso, para acordes o jogo usa uma heurística de
  "detecção de dedilhado" (`src/game/onsetDetector.ts`): ele percebe que
  *algo* foi tocado (um pico de volume) no momento certo, mas não confirma se
  o acorde estava com a pestana certa. A parte de ensino visual (diagrama de
  qual corda tocar/prender, com qual dedo) é sempre 100% confiável — só a
  conferência sonora de acordes é aproximada. Isso fica avisado na própria
  interface.

## Como rodar

Requer [Node.js](https://nodejs.org/) 18+.

```bash
npm install
npm run dev       # ambiente de desenvolvimento, com hot-reload
```

Abra o endereço que o Vite mostrar no terminal (normalmente
`http://localhost:5173`). O microfone só funciona em `localhost` ou HTTPS —
isso é uma exigência de segurança do navegador, não do app.

```bash
npm run build     # gera a versão de produção em dist/
npm run preview   # serve a versão de produção localmente
```

## Estrutura do projeto

```
src/
  audio/            conversão frequência↔nota, detector de pitch (autocorrelação), sintetizador
  guitar/           dados do braço do violão (afinação padrão) e formas de acordes abertos
  game/             chart de músicas/exercícios, motor do jogo (timing/pontuação), renderer do canvas
  lessons/          conteúdo das aulas passo a passo
  ui/               telas (menu, afinador, aulas, seleção de música, jogo, resultado) e diagramas SVG
```

- `game/chart.ts` define o formato de uma música/exercício: uma lista de
  eventos de **nota** (corda + traste + tempo) ou **acorde** (id do acorde +
  tempo + duração). `game/songs.ts` tem os 4 exercícios inclusos: Cordas
  Soltas, Primeiros Trastes, Brilha Brilha Estrelinha e uma progressão de
  acordes (Em-C-G-D).
- `guitar/chords.ts` define as formas dos acordes abertos (quais cordas
  tocar, em qual traste, com qual dedo) — é a "fonte da verdade" usada tanto
  pelos diagramas quanto pelo áudio de referência.

## Adicionando conteúdo

- **Nova música/exercício**: adicione um `Chart` em `src/game/songs.ts` (dá
  pra usar o helper `buildMelody` para melodias em notas separadas, mapeando
  letras de nota para posição no braço).
- **Novo acorde**: adicione uma entrada em `CHORDS` em `src/guitar/chords.ts`.
- **Nova aula**: adicione um `LessonModule` em `src/lessons/lessons.ts`.

## Possíveis próximos passos

- Detecção de acordes mais robusta (ex: análise de croma/FFT para conferir
  quais notas estão presentes, não só que houve um dedilhado).
  Amostras de áudio reais em vez do sintetizador (osciladores) para as notas
  de referência.
- Mais músicas/exercícios, com níveis de dificuldade.
- Salvar progresso do jogador (localStorage): melhor pontuação, aulas
  concluídas.
- Suporte a toque (mobile) para simular cordas sem teclado físico.
