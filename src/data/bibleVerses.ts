// Bible Advice (NIV) — short, well-known verses, quoted with their reference.
// Matching is by topic keywords in the current advice text. If no verse
// scores a match, a random verse is shown instead — a Bible thought for
// today, rather than forcing a weak match.
export interface BibleVerse { ref: string; text: string; keys: string[]; }
export const BIBLE_VERSES: BibleVerse[] = [
  {
    "ref": "Proverbs 3:5-6",
    "text": "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.",
    "keys": [
      "trust",
      "doubt",
      "understand",
      "path",
      "decision",
      "direction"
    ]
  },
  {
    "ref": "James 1:5",
    "text": "If any of you lacks wisdom, you should ask God, who gives generously to all without finding fault, and it will be given to you.",
    "keys": [
      "wisdom",
      "wise",
      "learn",
      "knowledge",
      "understand",
      "advice"
    ]
  },
  {
    "ref": "Proverbs 19:20",
    "text": "Listen to advice and accept discipline, and at the end you will be counted among the wise.",
    "keys": [
      "listen",
      "advice",
      "discipline",
      "wise",
      "learn"
    ]
  },
  {
    "ref": "Psalm 27:1",
    "text": "The Lord is my light and my salvation — whom shall I fear? The Lord is the stronghold of my life — of whom shall I be afraid?",
    "keys": [
      "fear",
      "afraid",
      "courage",
      "brave",
      "scared",
      "worry"
    ]
  },
  {
    "ref": "Joshua 1:9",
    "text": "Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.",
    "keys": [
      "courage",
      "brave",
      "strong",
      "afraid",
      "fear",
      "discouraged"
    ]
  },
  {
    "ref": "Philippians 4:6-7",
    "text": "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.",
    "keys": [
      "anxious",
      "worry",
      "peace",
      "calm",
      "prayer",
      "afraid"
    ]
  },
  {
    "ref": "Galatians 6:9",
    "text": "Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.",
    "keys": [
      "give up",
      "weary",
      "tired",
      "persevere",
      "keep going",
      "fail",
      "slowly"
    ]
  },
  {
    "ref": "Proverbs 16:3",
    "text": "Commit to the Lord whatever you do, and he will establish your plans.",
    "keys": [
      "plan",
      "work",
      "goal",
      "success",
      "commit",
      "do"
    ]
  },
  {
    "ref": "Colossians 3:23",
    "text": "Whatever you do, work at it with all your heart, as working for the Lord, not for human masters.",
    "keys": [
      "work",
      "hard",
      "effort",
      "job",
      "success"
    ]
  },
  {
    "ref": "Proverbs 15:1",
    "text": "A gentle answer turns away wrath, but a harsh word stirs up anger.",
    "keys": [
      "anger",
      "harsh",
      "gentle",
      "quiet",
      "calm",
      "argue",
      "word"
    ]
  },
  {
    "ref": "Ephesians 4:32",
    "text": "Be kind and compassionate to one another, forgiving each other, just as in Christ God forgave you.",
    "keys": [
      "kind",
      "forgive",
      "compassion",
      "friend",
      "others",
      "smile"
    ]
  },
  {
    "ref": "Matthew 7:12",
    "text": "So in everything, do to others what you would have them do to you, for this sums up the Law and the Prophets.",
    "keys": [
      "others",
      "friend",
      "kind",
      "treat",
      "people"
    ]
  },
  {
    "ref": "1 Thessalonians 5:18",
    "text": "Give thanks in all circumstances; for this is God's will for you in Christ Jesus.",
    "keys": [
      "thank",
      "gratitude",
      "grateful",
      "happy",
      "joy"
    ]
  },
  {
    "ref": "Romans 12:12",
    "text": "Be joyful in hope, patient in affliction, faithful in prayer.",
    "keys": [
      "patient",
      "patience",
      "hope",
      "wait",
      "slowly",
      "affliction"
    ]
  },
  {
    "ref": "Proverbs 11:2",
    "text": "When pride comes, then comes disgrace, but with humility comes wisdom.",
    "keys": [
      "pride",
      "humble",
      "humility",
      "ego"
    ]
  },
  {
    "ref": "Ecclesiastes 3:1",
    "text": "There is a time for everything, and a season for every activity under the heavens.",
    "keys": [
      "time",
      "season",
      "wait",
      "patient",
      "moment"
    ]
  },
  {
    "ref": "Psalm 119:105",
    "text": "Your word is a lamp for my feet, a light on my path.",
    "keys": [
      "path",
      "direction",
      "light",
      "guide",
      "decision"
    ]
  },
  {
    "ref": "Proverbs 27:17",
    "text": "As iron sharpens iron, so one person sharpens another.",
    "keys": [
      "friend",
      "sharpen",
      "learn",
      "others",
      "people",
      "grow"
    ]
  }
];

export function findBibleVerse(adviceText: string): { verse: BibleVerse; matched: boolean } {
  const text = (adviceText || "").toLowerCase();
  let best: BibleVerse | null = null;
  let bestScore = 0;
  for (const v of BIBLE_VERSES) {
    let score = 0;
    for (const k of v.keys) if (text.includes(k)) score++;
    if (score > bestScore) { bestScore = score; best = v; }
  }
  if (best && bestScore > 0) return { verse: best, matched: true };
  return { verse: BIBLE_VERSES[Math.floor(Math.random() * BIBLE_VERSES.length)], matched: false };
}
