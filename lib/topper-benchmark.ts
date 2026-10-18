// ponytail: static benchmark data — no AI, no network.
// Based on commonly cited study patterns for Indian competitive exams.

interface TopperBenchmark {
  dailyMinutes: number
  minDailyMinutes: number
  minutesPerTopic: number
  totalTopics: number
  tips: string[]
}

const BENCHMARKS: Record<string, TopperBenchmark> = {
  jee: {
    dailyMinutes: 420,
    minDailyMinutes: 300,
    minutesPerTopic: 45,
    totalTopics: 230,
    tips: [
      'Top JEE rankers study 6-7 hours daily outside coaching.',
      'Physics needs 40% of your time — it has the highest weightage.',
      'Solve 30+ numericals per day in the last 3 months.',
      'Revise every 7 days — spaced repetition beats cramming.',
    ],
  },
  neet: {
    dailyMinutes: 420,
    minDailyMinutes: 300,
    minutesPerTopic: 35,
    totalTopics: 200,
    tips: [
      'Biology is 50% of NEET — give it equal time with Physics+Chem.',
      'NCERT is the bible — read every line, especially Biology.',
      'Solve previous year papers (2015-2024) weekly.',
      'Anatomy and Physiology need repeated revision.',
    ],
  },
  'class-10': {
    dailyMinutes: 300,
    minDailyMinutes: 180,
    minutesPerTopic: 30,
    totalTopics: 140,
    tips: [
      'Board toppers study 4-5 hours daily for 6 months.',
      'NCERT textbook exercises are enough for 90%+ marks.',
      'Maths needs daily practice — don\'t skip even one day.',
      'Focus on presentation — step-by-step writing scores more.',
    ],
  },
  boards: {
    dailyMinutes: 300,
    minDailyMinutes: 180,
    minutesPerTopic: 30,
    totalTopics: 140,
    tips: [
      'Board toppers study 4-5 hours daily for 6 months.',
      'NCERT textbook exercises are enough for 90%+ marks.',
      'Solve 5 years of previous papers before exams.',
      'Write practice answers — time yourself.',
    ],
  },
}

const GENERIC_BENCHMARK: TopperBenchmark = {
  dailyMinutes: 300,
  minDailyMinutes: 180,
  minutesPerTopic: 30,
  totalTopics: 100,
  tips: [
    'Consistent 4-5 hours of focused study beats occasional marathons.',
    'Break your syllabus into weekly targets.',
    'Active recall (testing yourself) is 2x more effective than re-reading.',
    'Sleep 7+ hours — your brain consolidates learning during sleep.',
  ],
}

export function getTopperBenchmark(academicGoal: string): TopperBenchmark {
  return BENCHMARKS[academicGoal] ?? GENERIC_BENCHMARK
}

export function getTopperTips(userDailyMinutes: number, academicGoal: string): string[] {
  const bench = getTopperBenchmark(academicGoal)
  const gap = bench.dailyMinutes - userDailyMinutes

  if (gap <= 0) {
    return [
      'Your study time matches top performers. Keep the consistency.',
      'Focus on quality now — active recall, spaced repetition.',
      'Start solving previous year papers under timed conditions.',
    ]
  }

  if (gap <= 60) {
    return [
      `You need ~${Math.round(gap / 7)} more minutes per day to match top performers.`,
      ...bench.tips.slice(0, 2),
    ]
  }

  return [
    `Top performers study ${Math.round(bench.dailyMinutes / 60)}h/day. You are at ${Math.round(userDailyMinutes / 60)}h.`,
    `Add ${Math.round(gap / 7)} minutes per day this week — even small increases compound.`,
    ...bench.tips.slice(0, 2),
  ]
}
