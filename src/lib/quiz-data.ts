export type Question = {
  q: string;
  choices: string[];
  answer: number; // index
  /** Accepted short-answer strings (case/space-insensitive). Defaults to choices[answer]. */
  accept?: string[];
};

export type Subject = {
  id: string;
  name: string;
  emoji: string;
  blurb: string;
  questions: Question[];
};

export type QuizMode = "mc" | "short";

export const SUBJECTS: Subject[] = [
  {
    id: "math",
    name: "Math",
    emoji: "➗",
    blurb: "Algebra, geometry, and a sprinkle of calculus.",
    questions: [
      { q: "Solve for x: 2x + 6 = 20", choices: ["x = 6", "x = 7", "x = 8", "x = 10"], answer: 1, accept: ["7", "x=7", "x = 7"] },
      { q: "What is √144?", choices: ["10", "11", "12", "14"], answer: 2, accept: ["12"] },
      { q: "Slope of a line through (1,2) and (3,8)?", choices: ["2", "3", "4", "6"], answer: 1, accept: ["3"] },
      { q: "sin(30°) = ?", choices: ["1/2", "√2/2", "√3/2", "1"], answer: 0, accept: ["1/2", "0.5", ".5"] },
      { q: "Sum of interior angles of a hexagon (in degrees)?", choices: ["360", "540", "720", "900"], answer: 2, accept: ["720", "720°"] },
      { q: "Derivative of x²?", choices: ["x", "2x", "x²/2", "2"], answer: 1, accept: ["2x"] },
      { q: "log₁₀(1000) = ?", choices: ["2", "3", "10", "100"], answer: 1, accept: ["3"] },
      { q: "If f(x) = 3x − 4, find f(5).", choices: ["7", "11", "15", "19"], answer: 1, accept: ["11"] },
    ],
  },
  {
    id: "english",
    name: "English",
    emoji: "📚",
    blurb: "Grammar, literature, and writing craft.",
    questions: [
      { q: "Which is a complete sentence? (Answer A, B, C, or D for: A) Running in the park.  B) She runs daily.  C) Because of the rain.  D) Although tired.)", choices: ["Running in the park.", "She runs daily.", "Because of the rain.", "Although tired."], answer: 1, accept: ["B", "She runs daily", "She runs daily."] },
      { q: "What is the past tense of 'go'?", choices: ["goed", "gone", "went", "goes"], answer: 2, accept: ["went"] },
      { q: "Who wrote 'Romeo and Juliet'?", choices: ["Charles Dickens", "William Shakespeare", "Mark Twain", "Jane Austen"], answer: 1, accept: ["shakespeare", "william shakespeare"] },
      { q: "A direct comparison without 'like' or 'as' is called a ___.", choices: ["Metaphor", "Simile", "Hyperbole", "Onomatopoeia"], answer: 0, accept: ["metaphor"] },
      { q: "In 'She sings beautifully,' which word is the adverb?", choices: ["She", "sings", "beautifully", "none"], answer: 2, accept: ["beautifully"] },
      { q: "Give a one-word synonym for 'arduous'.", choices: ["Easy", "Difficult", "Quick", "Bright"], answer: 1, accept: ["difficult", "hard", "tough"] },
      { q: "Capital of France — a proper noun example.", choices: ["city", "Paris", "river", "country"], answer: 1, accept: ["paris"] },
      { q: "What point of view uses 'I' and 'we'? (first/second/third)", choices: ["First person", "Second person", "Third limited", "Third omniscient"], answer: 0, accept: ["first", "first person", "1st"] },
    ],
  },
  {
    id: "science",
    name: "Science",
    emoji: "🔬",
    blurb: "Biology, chemistry, and physics fundamentals.",
    questions: [
      { q: "Chemical symbol for gold?", choices: ["Go", "Gd", "Au", "Ag"], answer: 2, accept: ["Au"] },
      { q: "Powerhouse of the cell?", choices: ["Nucleus", "Mitochondria", "Ribosome", "Golgi"], answer: 1, accept: ["mitochondria", "mitochondrion"] },
      { q: "Speed of light (m/s, scientific notation like 3e8)?", choices: ["3×10⁵", "3×10⁶", "3×10⁸", "3×10¹⁰"], answer: 2, accept: ["3e8", "3x10^8", "3*10^8", "299792458"] },
      { q: "Newton's 2nd law as an equation:", choices: ["F = ma", "E = mc²", "P = IV", "V = IR"], answer: 0, accept: ["f=ma", "f = ma"] },
      { q: "How many bones in the adult human body?", choices: ["186", "206", "226", "246"], answer: 1, accept: ["206"] },
      { q: "Gas plants absorb for photosynthesis?", choices: ["O₂", "N₂", "CO₂", "H₂"], answer: 2, accept: ["co2", "carbon dioxide"] },
      { q: "pH of pure water?", choices: ["5", "6", "7", "8"], answer: 2, accept: ["7"] },
      { q: "Largest planet in our solar system?", choices: ["Saturn", "Jupiter", "Neptune", "Earth"], answer: 1, accept: ["jupiter"] },
    ],
  },
  {
    id: "sst",
    name: "Social Studies",
    emoji: "🌍",
    blurb: "History, geography, and civics.",
    questions: [
      { q: "Longest river in the world?", choices: ["Amazon", "Nile", "Yangtze", "Mississippi"], answer: 1, accept: ["nile", "the nile"] },
      { q: "First President of the USA?", choices: ["Lincoln", "Jefferson", "Washington", "Adams"], answer: 2, accept: ["washington", "george washington"] },
      { q: "On which continent is the Sahara desert?", choices: ["Asia", "Africa", "Australia", "South America"], answer: 1, accept: ["africa"] },
      { q: "Capital of Japan?", choices: ["Kyoto", "Osaka", "Tokyo", "Seoul"], answer: 2, accept: ["tokyo"] },
      { q: "Year WWII ended?", choices: ["1942", "1945", "1948", "1950"], answer: 1, accept: ["1945"] },
      { q: "Name the branch of US government that makes laws.", choices: ["Executive", "Legislative", "Judicial", "Federal"], answer: 1, accept: ["legislative", "congress"] },
      { q: "Year the Berlin Wall fell?", choices: ["1979", "1985", "1989", "1991"], answer: 2, accept: ["1989"] },
      { q: "Smallest country in the world?", choices: ["Monaco", "Vatican City", "Nauru", "San Marino"], answer: 1, accept: ["vatican", "vatican city"] },
    ],
  },
  {
    id: "bible",
    name: "Bible",
    emoji: "✝️",
    blurb: "Scripture knowledge from the Old and New Testament.",
    questions: [
      { q: "How many books are in the Protestant Bible?", choices: ["46", "60", "66", "72"], answer: 2, accept: ["66"] },
      { q: "First book of the Bible?", choices: ["Exodus", "Genesis", "Psalms", "Matthew"], answer: 1, accept: ["genesis"] },
      { q: "Who led the Israelites out of Egypt?", choices: ["Abraham", "Moses", "David", "Joshua"], answer: 1, accept: ["moses"] },
      { q: "How many disciples did Jesus choose?", choices: ["7", "10", "12", "14"], answer: 2, accept: ["12", "twelve"] },
      { q: "Who baptized Jesus?", choices: ["Peter", "John the Baptist", "Paul", "Andrew"], answer: 1, accept: ["john", "john the baptist"] },
      { q: "Shortest verse in the KJV Bible (two words)?", choices: ["John 3:16", "Jesus wept.", "God is love.", "Pray always."], answer: 1, accept: ["jesus wept", "jesus wept."] },
      { q: "Who wrote most of the New Testament letters?", choices: ["Peter", "John", "Paul", "James"], answer: 2, accept: ["paul", "apostle paul"] },
      { q: "On which day did God rest? (number)", choices: ["5th", "6th", "7th", "8th"], answer: 2, accept: ["7", "7th", "seventh"] },
    ],
  },
];

export const getSubject = (id: string) => SUBJECTS.find((s) => s.id === id);

export function normalizeAnswer(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:'"`]/g, "")
    .replace(/\s+/g, " ");
}

export function checkShortAnswer(q: Question, input: string): boolean {
  const norm = normalizeAnswer(input);
  if (!norm) return false;
  const accepted = q.accept && q.accept.length > 0 ? q.accept : [q.choices[q.answer]];
  return accepted.some((a) => normalizeAnswer(a) === norm);
}
