// Deterministic FAQ matching — same "quiet intelligence" pattern as the rest
// of the planning engine (see planning.ts): a rule-based stand-in, no
// external AI call, so an answer is always instant and never wrong about
// what Pace actually does.

export interface FaqEntry {
  id: string
  question: string
  keywords: string[]
  answer: string
}

export const FAQ_ENTRIES: FaqEntry[] = [
  {
    id: 'priority',
    question: 'What do Must, Should, and Could mean?',
    keywords: ['must', 'should', 'could', 'priority', 'important'],
    answer:
      "They're how important a task is, from your own judgment — not urgency. Must gets protected first when a day is heavy or you ask for a Minimum Day; Could is the first thing set aside. Set it under a task's More options.",
  },
  {
    id: 'due-date',
    question: 'How do due dates and missed deadlines work?',
    keywords: ['due', 'deadline', 'missed', 'overdue', 'late'],
    answer:
      "Give a task, project, or goal a due date and Pace plans a little headroom before it automatically. If one passes, a banner appears at the top of the app — tap Review to mark it done, push it to tomorrow, pick a new date, or let it go. Nothing is deleted for you.",
  },
  {
    id: 'minimum-day',
    question: 'What is a Minimum Day?',
    keywords: ['minimum day', 'minimum', 'too much', 'lighter'],
    answer:
      "From Today → Need help? → \"I need a minimum day,\" Pace shows only the few things that actually have to happen (Must-priority, Top 3, fixed commitments) and defers everything else — fully reversible with Undo.",
  },
  {
    id: 'tomorrow-debt',
    question: 'What happens when I move a task to tomorrow?',
    keywords: ['move to tomorrow', 'tomorrow', 'postpone', 'reschedule'],
    answer:
      "\"Move to tomorrow\" (in a task's ••• menu) checks how full tomorrow already is first. If it's getting crowded, Pace tells you the projected total before moving anything, so you see the cost before you create it.",
  },
  {
    id: 'fragility',
    question: 'What does "this part of your day is fragile" mean?',
    keywords: ['fragile', 'fragility', 'breathing room', 'back to back'],
    answer:
      "It means two fixed, timed tasks are scheduled back-to-back with no gap — if one runs long, the next is affected. \"Add breathing room\" pushes the later ones apart by 15 minutes automatically.",
  },
  {
    id: 'resume-note',
    question: 'What is "leave future you a note"?',
    keywords: ['note', 'resume', 'where i left off', 'future me', 'handoff'],
    answer:
      "In Focus Mode, \"I'll finish this later\" lets you jot down exactly where you stopped (\"Intro finished, continue from 2:14\"). It shows on the task next time you see it, so nothing gets lost to memory.",
  },
  {
    id: 'estimate-learning',
    question: 'Why does Pace suggest a different duration for a task?',
    keywords: ['estimate', 'duration', 'suggest', 'how long'],
    answer:
      "Once a project has a few finished tasks, Pace quietly compares your estimate against how long they actually took (tracked from Focus Mode) and offers a truer number if there's a real gap. It's scoped to that project's own history, not a guess.",
  },
  {
    id: 'success-condition',
    question: 'What is "Today\'s win"?',
    keywords: ["today's win", 'success condition', 'successful', 'morning check-in'],
    answer:
      "During your morning check-in, Pace asks what would make today feel successful. Your answer stays pinned near the top of Today as a small ♡ reminder — one thing, not a priority list.",
  },
  {
    id: 'habit-frequency',
    question: 'Can a habit run less than every day?',
    keywords: ['habit', 'frequency', 'days a week', 'specific days', 'often'],
    answer:
      "Yes — when adding or editing a habit, choose Every day, a number of days a week, or specific weekdays. It only shows up on days it's actually due, though it stays visible if you already logged it today.",
  },
  {
    id: 'calendar',
    question: 'What does the Calendar page show?',
    keywords: ['calendar', 'month view', 'history'],
    answer:
      "A month grid with a dot per day for what you finished, what's due, what you missed, and what's planned. Tap any day — past or future — to see its full detail and add a task to it.",
  },
  {
    id: 'focus-mode',
    question: 'How does Focus Mode work?',
    keywords: ['focus mode', 'timer', 'start a task'],
    answer:
      "Tap Start on a task to enter a distraction-free countdown timer for just that task, with optional focus sounds or music playing alongside. Done marks it complete; \"I'll finish this later\" lets you pause with a note.",
  },
  {
    id: 'sounds',
    question: 'Where do I change focus sounds or music?',
    keywords: ['sound', 'music', 'mood', 'noise'],
    answer:
      "Tap the music-note icon (top right on desktop, in the mobile header) for ambient Sounds (rain, cafe, noise colors) and a Music tab with tracks grouped by mood — Calm, Focus, Uplift, Dreamy, Chill.",
  },
  {
    id: 'smart-add',
    question: 'What\'s the difference between Smart Add and Brain Dump?',
    keywords: ['smart add', 'brain dump', 'quick add'],
    answer:
      "Smart Add (the + button) is for one thing at a time — type it and Pace guesses whether it's a task, project, goal, or habit. \"Got a few things? Dump them all\" inside it opens Brain Dump for sorting several at once.",
  },
  {
    id: 'skip',
    question: 'What happens when I skip a task?',
    keywords: ['skip', "can't do", 'stuck'],
    answer:
      "You're asked why (too big, no time, low energy, not important, stuck, or just not today). Pace responds differently for each — shrinking the task, rescheduling it, offering a lighter version, or asking if it still matters.",
  },
  {
    id: 'overwhelmed',
    question: 'What does "I\'m overwhelmed" do?',
    keywords: ['overwhelmed', 'too much', 'stressed'],
    answer:
      'From Today → Need help?, it walks you through a 5/15/30-minute plan for right now, and can break a task into a smaller first step without touching the rest of your day.',
  },
  {
    id: 'pause',
    question: 'What does pausing Pace do?',
    keywords: ['pause', 'break', 'time off'],
    answer:
      "Pausing hides the normal planning flow and quiets reminders while showing only your closest deadlines, for as long as you choose. Resume rebuilds your plan gently whenever you're ready — nothing is lost.",
  },
  {
    id: 'recovery',
    question: 'What happens if I come back after a few days away?',
    keywords: ['away', 'inactive', 'welcome back', 'behind'],
    answer:
      "After a few inactive days, Pace opens with \"Welcome back — you don't need to catch up\" and asks, item by item, whether each pending thing still matters, can move, or is no longer relevant — then gives you one place to start.",
  },
  {
    id: 'export-data',
    question: 'Can I export or clear my data?',
    keywords: ['export', 'delete data', 'clear data', 'backup'],
    answer:
      "Both live under Me → Account: \"Export data\" downloads a JSON file of everything; \"Clear all my data\" wipes tasks, habits, projects and history while keeping your account — useful for starting fresh.",
  },
  {
    id: 'projects-vs-goals',
    question: "What's the difference between a Project, a Goal, and a Habit?",
    keywords: ['project', 'goal', 'habit', 'difference'],
    answer:
      "A Project is anything with more than one step (tasks live inside it). A Goal is a monthly or weekly intention you're aiming at, not something you check off in one sitting. A Habit is a repeatable daily or weekly action.",
  },
]

const MIN_SCORE = 1

// Scores every entry by how many of its keywords appear in the query, plus a
// bonus if the query's words appear in the question itself — picks the best
// match, or null if nothing clears the bar (never a wrong-but-confident guess).
export function findAnswer(query: string): FaqEntry | null {
  const q = query.trim().toLowerCase()
  if (q.length < 2) return null

  let best: FaqEntry | null = null
  let bestScore = 0

  for (const entry of FAQ_ENTRIES) {
    let score = 0
    for (const keyword of entry.keywords) {
      if (q.includes(keyword)) score += 2
    }
    if (entry.question.toLowerCase().includes(q)) score += 3
    for (const word of q.split(/\s+/)) {
      if (word.length > 3 && entry.question.toLowerCase().includes(word)) score += 1
    }
    if (score > bestScore) {
      bestScore = score
      best = entry
    }
  }

  return bestScore >= MIN_SCORE ? best : null
}
