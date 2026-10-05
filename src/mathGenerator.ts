export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export interface MathQuestion {
  id: string;
  topic: string;
  question: string;
  options: string[];
  correctAnswer: string;
  difficulty: QuestionDifficulty;
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generateDistractors(correctVal: number, count: number = 3): string[] {
  const distractors = new Set<number>();
  const offsets = [-3, -2, -1, 1, 2, 3, 5, -5, 10, -10];

  while (distractors.size < count) {
    const offset = offsets[Math.floor(Math.random() * offsets.length)];
    const candidate = correctVal + offset;
    if (candidate !== correctVal) {
      distractors.add(candidate);
    }
  }

  return Array.from(distractors).map(d => d.toString());
}

export function generateQuestion(difficulty: QuestionDifficulty = 'easy'): MathQuestion {
  const generators = [
    generateLinearEquation,
    generatePercentages,
    generatePowersAndRoots,
    generateFractions,
    generatePythagoras,
    generateWordProblem,
    generateExpressions
  ];

  const chosenGen = generators[Math.floor(Math.random() * generators.length)];
  return chosenGen(difficulty);
}

function generateLinearEquation(difficulty: QuestionDifficulty): MathQuestion {
  if (difficulty === 'easy') {
    const a = getRandomInt(2, 6);
    const x = getRandomInt(1, 10);
    const b = getRandomInt(1, 15);
    const c = a * x + b;
    const question = `Vyřeš rovnici pro x:\n${a}x + ${b} = ${c}`;
    const correctStr = x.toString();
    const options = shuffleArray([correctStr, ...generateDistractors(x)]);
    return {
      id: Math.random().toString(),
      topic: 'Lineární rovnice',
      question,
      options,
      correctAnswer: correctStr,
      difficulty
    };
  } else if (difficulty === 'medium') {
    const x = getRandomInt(2, 10);
    const c = getRandomInt(1, 5);
    const diff = getRandomInt(1, 4);
    const a = c + diff;
    const d = getRandomInt(1, 20);
    const b = (a - c) * x - d;

    const bSign = b >= 0 ? `- ${b}` : `+ ${Math.abs(b)}`;
    const question = `Vyřeš rovnici pro x:\n${a}x ${bSign} = ${c}x + ${d}`;
    const correctStr = x.toString();
    const options = shuffleArray([correctStr, ...generateDistractors(x)]);
    return {
      id: Math.random().toString(),
      topic: 'Lineární rovnice',
      question,
      options,
      correctAnswer: correctStr,
      difficulty
    };
  } else {
    const x = getRandomInt(3, 12);
    const a = getRandomInt(2, 4);
    const b = getRandomInt(1, 5);
    const d = getRandomInt(1, a - 1);
    const c = (a - d) * x + a * b + d;

    const question = `Vyřeš rovnici pro x:\n${a}(x + ${b}) - ${c} = ${d}(x - 1)`;
    const correctStr = x.toString();
    const options = shuffleArray([correctStr, ...generateDistractors(x)]);
    return {
      id: Math.random().toString(),
      topic: 'Lineární rovnice se závorkami',
      question,
      options,
      correctAnswer: correctStr,
      difficulty
    };
  }
}

function generatePercentages(difficulty: QuestionDifficulty): MathQuestion {
  if (difficulty === 'easy') {
    const percent = getRandomInt(1, 9) * 10;
    const base = getRandomInt(2, 20) * 10;
    const ans = (percent / 100) * base;

    const question = `Spočítej ${percent} % ze základu ${base}:`;
    const correctStr = ans.toString();
    const options = shuffleArray([correctStr, ...generateDistractors(ans)]);
    return {
      id: Math.random().toString(),
      topic: 'Procenta',
      question,
      options,
      correctAnswer: correctStr,
      difficulty
    };
  } else if (difficulty === 'medium') {
    const origPrice = getRandomInt(2, 20) * 50;
    const discount = getRandomInt(1, 5) * 10;
    const finalPrice = origPrice * (1 - discount / 100);

    const question = `Zboží stálo ${origPrice} Kč. Bylo zlevněno o ${discount} %. Kolik Kč stojí nyní?`;
    const correctStr = finalPrice.toString();
    const options = shuffleArray([correctStr, ...generateDistractors(finalPrice)]);
    return {
      id: Math.random().toString(),
      topic: 'Procenta - Sleva',
      question,
      options,
      correctAnswer: correctStr,
      difficulty
    };
  } else {
    const percent = getRandomInt(1, 4) * 15;
    const base = getRandomInt(2, 10) * 100;
    const part = (percent / 100) * base;

    const question = `Kolik je základ (100 %), jestliže ${percent} % činí ${part}?`;
    const correctStr = base.toString();
    const options = shuffleArray([correctStr, ...generateDistractors(base)]);
    return {
      id: Math.random().toString(),
      topic: 'Procenta - Výpočet základu',
      question,
      options,
      correctAnswer: correctStr,
      difficulty
    };
  }
}

function generatePowersAndRoots(difficulty: QuestionDifficulty): MathQuestion {
  if (difficulty === 'easy') {
    const base = getRandomInt(2, 12);
    const ans = base * base;
    const question = `Vypočítej hodnotu odmocniny: √${ans}`;
    const correctStr = base.toString();
    const options = shuffleArray([correctStr, ...generateDistractors(base)]);
    return {
      id: Math.random().toString(),
      topic: 'Odmocniny',
      question,
      options,
      correctAnswer: correctStr,
      difficulty
    };
  } else if (difficulty === 'medium') {
    const a = getRandomInt(2, 9);
    const b = getRandomInt(2, 6);
    const ans = a * a + b * b;
    const question = `Vypočítej výraz: ${a}² + ${b}²`;
    const correctStr = ans.toString();
    const options = shuffleArray([correctStr, ...generateDistractors(ans)]);
    return {
      id: Math.random().toString(),
      topic: 'Mocniny',
      question,
      options,
      correctAnswer: correctStr,
      difficulty
    };
  } else {
    const sq1 = getRandomInt(4, 15);
    const sq2 = getRandomInt(2, 10);
    const val1 = sq1 * sq1;
    const finalAns = sq1 - 8 + sq2;

    const question = `Vypočítej: √${val1} - 2³ + ${sq2}`;
    const correctStr = finalAns.toString();
    const options = shuffleArray([correctStr, ...generateDistractors(finalAns)]);
    return {
      id: Math.random().toString(),
      topic: 'Mocniny a odmocniny',
      question,
      options,
      correctAnswer: correctStr,
      difficulty
    };
  }
}

function generateFractions(difficulty: QuestionDifficulty): MathQuestion {
  if (difficulty === 'easy') {
    const denom = getRandomInt(3, 8);
    const num1 = getRandomInt(1, denom - 1);
    const num2 = getRandomInt(1, denom - 1);
    const sumNum = num1 + num2;
    const question = `Spočítej zlomky: ${num1}/${denom} + ${num2}/${denom}`;
    const correctStr = `${sumNum}/${denom}`;

    const opts = new Set<string>();
    opts.add(correctStr);
    opts.add(`${sumNum + 1}/${denom}`);
    opts.add(`${sumNum - 1 > 0 ? sumNum - 1 : sumNum + 2}/${denom}`);
    opts.add(`${sumNum}/${denom + 1}`);

    return {
      id: Math.random().toString(),
      topic: 'Zlomky',
      question,
      options: shuffleArray(Array.from(opts)),
      correctAnswer: correctStr,
      difficulty
    };
  } else {
    const denom = getRandomInt(3, 6);
    const num = getRandomInt(1, denom - 1);
    const factor = getRandomInt(4, 20);
    const total = denom * factor;
    const ans = num * factor;

    const question = `Vypočítej ${num}/${denom} ze čísla ${total}:`;
    const correctStr = ans.toString();
    const options = shuffleArray([correctStr, ...generateDistractors(ans)]);

    return {
      id: Math.random().toString(),
      topic: 'Zlomky - Část z celku',
      question,
      options,
      correctAnswer: correctStr,
      difficulty
    };
  }
}

function generatePythagoras(difficulty: QuestionDifficulty): MathQuestion {
  const triples = [
    [3, 4, 5],
    [6, 8, 10],
    [5, 12, 13],
    [9, 12, 15],
    [8, 15, 17]
  ];
  const triple = triples[Math.floor(Math.random() * triples.length)];

  if (difficulty === 'easy' || Math.random() > 0.5) {
    const a = triple[0];
    const b = triple[1];
    const c = triple[2];

    const question = `Pravoúhlý trojúhelník má odvěsny a = ${a} cm, b = ${b} cm. Jaká je délka přepony c?`;
    const correctStr = `${c} cm`;
    const options = shuffleArray([
      `${c} cm`,
      `${c + 1} cm`,
      `${c - 2 > 0 ? c - 2 : c + 3} cm`,
      `${a + b} cm`
    ]);

    return {
      id: Math.random().toString(),
      topic: 'Pythagorova věta',
      question,
      options,
      correctAnswer: correctStr,
      difficulty
    };
  } else {
    const a = triple[0];
    const b = triple[1];
    const c = triple[2];

    const question = `Pravoúhlý trojúhelník má přeponu c = ${c} cm a odvěsnu b = ${b} cm. Jaká je odvěsna a?`;
    const correctStr = `${a} cm`;
    const options = shuffleArray([
      `${a} cm`,
      `${a + 2} cm`,
      `${a - 1 > 0 ? a - 1 : a + 4} cm`,
      `${c - b} cm`
    ]);

    return {
      id: Math.random().toString(),
      topic: 'Pythagorova věta',
      question,
      options,
      correctAnswer: correctStr,
      difficulty
    };
  }
}

function generateWordProblem(difficulty: QuestionDifficulty): MathQuestion {
  if (difficulty === 'easy') {
    const pavel = getRandomInt(3, 10);
    const factor = getRandomInt(2, 4);
    const petr = pavel * factor;
    const total = pavel + petr;

    const question = `Petr má ${factor}x více karet než Pavel. Dohromady mají ${total} karet. Kolik karet má Petr?`;
    const correctStr = petr.toString();
    const options = shuffleArray([correctStr, ...generateDistractors(petr)]);

    return {
      id: Math.random().toString(),
      topic: 'Slovní úlohy',
      question,
      options,
      correctAnswer: correctStr,
      difficulty
    };
  } else {
    const speed = getRandomInt(4, 12) * 10;
    const timeHours = getRandomInt(2, 5);
    const dist = speed * timeHours;

    const question = `Auto jede průměrnou rychlostí ${speed} km/h. Jakou vzdálenost (v km) ujede za ${timeHours} hodiny?`;
    const correctStr = `${dist} km`;
    const options = shuffleArray([
      `${dist} km`,
      `${dist + 20} km`,
      `${dist - 30 > 0 ? dist - 30 : dist + 50} km`,
      `${speed + timeHours} km`
    ]);

    return {
      id: Math.random().toString(),
      topic: 'Slovní úlohy - Rychlost',
      question,
      options,
      correctAnswer: correctStr,
      difficulty
    };
  }
}

function generateExpressions(difficulty: QuestionDifficulty): MathQuestion {
  const a = getRandomInt(2, 6);
  const b = getRandomInt(2, 5);

  if (Math.random() > 0.5) {
    const sq = a * a;
    const middle = 2 * a;
    const question = `Rozlož podle vzorce: (x + ${a})²`;
    const correctStr = `x² + ${middle}x + ${sq}`;
    const options = shuffleArray([
      correctStr,
      `x² + ${a}x + ${sq}`,
      `x² + ${middle}x + ${a * 2}`,
      `x² + ${sq}`
    ]);

    return {
      id: Math.random().toString(),
      topic: 'Výrazy a vzorce',
      question,
      options,
      correctAnswer: correctStr,
      difficulty
    };
  } else {
    const c = getRandomInt(1, a + b - 1);
    const res = a + b - c;
    const question = `Zjednoduš výraz: ${a}x + ${b}x - ${c}x`;
    const correctStr = `${res}x`;
    const options = shuffleArray([
      `${res}x`,
      `${res + 1}x`,
      `${res - 1 > 0 ? res - 1 : res + 3}x`,
      `${a + b + c}x`
    ]);

    return {
      id: Math.random().toString(),
      topic: 'Zjednodušování výrazů',
      question,
      options,
      correctAnswer: correctStr,
      difficulty
    };
  }
}
