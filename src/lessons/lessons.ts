export type LessonStep =
  | { kind: 'info'; title: string; body: string }
  | { kind: 'note'; title: string; body: string; string: number; fret: number; finger?: number }
  | { kind: 'chord'; title: string; body: string; chordId: string };

export interface LessonModule {
  id: string;
  title: string;
  summary: string;
  steps: LessonStep[];
}

export const LESSONS: LessonModule[] = [
  {
    id: 'first-steps',
    title: '1. Primeiros Passos',
    summary: 'Conheça o instrumento, o nome das cordas e toque suas primeiras notas.',
    steps: [
      {
        kind: 'info',
        title: 'Conhecendo o violão',
        body:
          'O violão tem 6 cordas. Da mais grossa (grave) para a mais fina (aguda), elas são afinadas em Mi-Lá-Ré-Sol-Si-Mi (E-A-D-G-B-e). ' +
          'A mão esquerda pressiona as cordas atrás dos trastes (as divisões metálicas no braço) e a mão direita toca/dedilha as cordas.',
      },
      {
        kind: 'info',
        title: 'Postura da mão esquerda',
        body:
          'Mantenha o polegar apoiado atrás do braço, mais ou menos atrás do dedo indicador. Pressione a corda bem perto do traste (do lado de cá, ' +
          'sem tocar em cima dele) usando a ponta do dedo, não a polpa — isso evita que a corda abafe.',
      },
      { kind: 'note', title: 'Corda Mi grave solta', body: 'Toque a corda mais grossa (Mi grave) solta, sem pressionar nada.', string: 0, fret: 0 },
      { kind: 'note', title: 'Corda Lá solta', body: 'Agora a corda Lá, a segunda mais grossa.', string: 1, fret: 0 },
      { kind: 'note', title: 'Corda Ré solta', body: 'Corda Ré, bem no meio.', string: 2, fret: 0 },
      { kind: 'note', title: 'Corda Sol solta', body: 'Corda Sol.', string: 3, fret: 0 },
      { kind: 'note', title: 'Corda Si solta', body: 'Corda Si.', string: 4, fret: 0 },
      { kind: 'note', title: 'Corda Mi aguda solta', body: 'E por fim a corda mais fina, Mi agudo.', string: 5, fret: 0 },
      {
        kind: 'note',
        title: 'Primeiro traste: dedo 1',
        body: 'Pressione o 1º traste da corda Mi grave com o dedo indicador (dedo 1) e toque a corda.',
        string: 0,
        fret: 1,
        finger: 1,
      },
      {
        kind: 'note',
        title: 'Segundo traste: dedo 2',
        body: 'Agora o 2º traste da mesma corda, com o dedo médio (dedo 2).',
        string: 0,
        fret: 2,
        finger: 2,
      },
      {
        kind: 'note',
        title: 'Terceiro traste: dedo 3',
        body: 'E o 3º traste, com o dedo anelar (dedo 3). Um dedo por traste — essa é a base de tudo.',
        string: 0,
        fret: 3,
        finger: 3,
      },
      {
        kind: 'info',
        title: 'Muito bem!',
        body:
          'Você já tocou as 6 cordas soltas e fez notas com os três primeiros dedos. Vá em "Tocar" e experimente os exercícios ' +
          '"Cordas Soltas" e "Primeiros Trastes" para praticar isso no ritmo do jogo.',
      },
    ],
  },
  {
    id: 'first-chords',
    title: '2. Seus Primeiros Acordes',
    summary: 'Aprenda 8 acordes essenciais, um de cada vez, com diagrama e dica.',
    steps: [
      {
        kind: 'info',
        title: 'O que é um acorde',
        body:
          'Um acorde é um grupo de notas tocadas juntas. Nos diagramas: ○ = corda solta, × = corda que não deve tocar, ' +
          'e os números nas bolinhas são os dedos (1=indicador, 2=médio, 3=anelar, 4=mínimo). Toque todas as cordas marcadas de uma vez, ' +
          'de cima para baixo, começando pela corda mais grave que fizer parte do acorde.',
      },
      {
        kind: 'chord',
        title: 'Mi menor (Em)',
        body: 'O acorde mais fácil do violão — só 2 dedos! Ótimo ponto de partida.',
        chordId: 'Em',
      },
      {
        kind: 'chord',
        title: 'Lá menor (Am)',
        body: 'Parecido com o Em: os mesmos dedos "sobem" uma corda. A corda Mi grave fica em silêncio (×).',
        chordId: 'Am',
      },
      {
        kind: 'chord',
        title: 'Dó maior (C)',
        body: 'Precisa de 3 dedos bem abertos. Cuidado para não encostar sem querer na corda Si.',
        chordId: 'C',
      },
      {
        kind: 'chord',
        title: 'Sol maior (G)',
        body: 'Um alongamento maior entre os dedos — vá com calma e reposicione se precisar.',
        chordId: 'G',
      },
      {
        kind: 'chord',
        title: 'Ré maior (D)',
        body: 'Formato triangular pequeno, usando só as 4 cordas mais agudas.',
        chordId: 'D',
      },
      {
        kind: 'chord',
        title: 'Mi maior (E)',
        body: 'Como o Em, mas com o dedo indicador a mais na corda Sol.',
        chordId: 'E',
      },
      {
        kind: 'chord',
        title: 'Lá maior (A)',
        body: 'Três dedos enfileirados no 2º traste. Cuidado para não abafar a corda Mi aguda.',
        chordId: 'A',
      },
      {
        kind: 'chord',
        title: 'Ré menor (Dm)',
        body: 'Parecido com o D, em um formato de "triângulo invertido".',
        chordId: 'Dm',
      },
      {
        kind: 'info',
        title: 'Excelente!',
        body:
          'Você já viu os 8 acordes abertos mais usados no violão. Vá em "Tocar" e experimente a "Primeira Progressão" ' +
          'para praticar a troca entre Em - C - G - D no seu próprio ritmo.',
      },
    ],
  },
];

export function getLesson(id: string): LessonModule | undefined {
  return LESSONS.find((l) => l.id === id);
}
