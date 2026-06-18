export type Question = {
  q: string;
  choices: string[];
  answer: number; // index
  /** Accepted short-answer strings (case/space-insensitive). Defaults to choices[answer]. */
  accept?: string[];
};

export type Topic = {
  id: string;
  name: string;
  blurb: string;
  questions: Question[];
};

export type Subject = {
  id: string;
  name: string;
  emoji: string;
  blurb: string;
  topics: Topic[];
};

export type QuizMode = "mc" | "short";

export const SUBJECTS: Subject[] = [
  {
    id: "math",
    name: "Math",
    emoji: "➗",
    blurb: "Algebra, geometry, trig, and a sprinkle of calculus.",
    topics: [
      {
        id: "algebra",
        name: "Algebra",
        blurb: "Equations, functions, and logarithms.",
        questions: [
          { q: "Solve for x: 2x + 6 = 20", choices: ["x = 6", "x = 7", "x = 8", "x = 10"], answer: 1, accept: ["7"] },
          { q: "If f(x) = 3x − 4, find f(5).", choices: ["7", "11", "15", "19"], answer: 1, accept: ["11"] },
          { q: "log₁₀(1000) = ?", choices: ["2", "3", "10", "100"], answer: 1, accept: ["3"] },
          { q: "Slope of a line through (1,2) and (3,8)?", choices: ["2", "3", "4", "6"], answer: 1, accept: ["3"] },
          { q: "Solve: x² − 9 = 0 (positive root)", choices: ["2", "3", "4", "9"], answer: 1, accept: ["3"] },
        ],
      },
      {
        id: "geometry",
        name: "Geometry",
        blurb: "Shapes, angles, and area.",
        questions: [
          { q: "Sum of interior angles of a hexagon (degrees)?", choices: ["360", "540", "720", "900"], answer: 2, accept: ["720"] },
          { q: "Area of a circle with radius 5 (use π)?", choices: ["10π", "25π", "50π", "100π"], answer: 1, accept: ["25π", "25pi"] },
          { q: "What is √144?", choices: ["10", "11", "12", "14"], answer: 2, accept: ["12"] },
          { q: "How many sides does a dodecagon have?", choices: ["10", "11", "12", "20"], answer: 2, accept: ["12"] },
          { q: "Pythagorean theorem: a² + b² = ?", choices: ["c", "c²", "2c", "ab"], answer: 1, accept: ["c²", "c2", "c^2"] },
        ],
      },
      {
        id: "trigonometry",
        name: "Trigonometry",
        blurb: "Sine, cosine, and angles.",
        questions: [
          { q: "sin(30°) = ?", choices: ["1/2", "√2/2", "√3/2", "1"], answer: 0, accept: ["1/2", "0.5"] },
          { q: "cos(0°) = ?", choices: ["0", "1/2", "√2/2", "1"], answer: 3, accept: ["1"] },
          { q: "tan(45°) = ?", choices: ["0", "1/2", "1", "√3"], answer: 2, accept: ["1"] },
          { q: "sin(90°) = ?", choices: ["0", "1/2", "√2/2", "1"], answer: 3, accept: ["1"] },
          { q: "Identity: sin²θ + cos²θ = ?", choices: ["0", "1", "2", "tan²θ"], answer: 1, accept: ["1"] },
        ],
      },
      {
        id: "calculus",
        name: "Calculus",
        blurb: "Derivatives and limits.",
        questions: [
          { q: "Derivative of x²?", choices: ["x", "2x", "x²/2", "2"], answer: 1, accept: ["2x"] },
          { q: "Derivative of a constant?", choices: ["0", "1", "x", "the constant"], answer: 0, accept: ["0"] },
          { q: "∫ 1 dx = ?", choices: ["0", "x + C", "1 + C", "x²"], answer: 1, accept: ["x+c", "x + c"] },
          { q: "Derivative of sin(x)?", choices: ["cos(x)", "−cos(x)", "−sin(x)", "tan(x)"], answer: 0, accept: ["cos(x)", "cosx"] },
          { q: "lim x→0 of sin(x)/x?", choices: ["0", "1", "∞", "undefined"], answer: 1, accept: ["1"] },
        ],
      },
    ],
  },
  {
    id: "english",
    name: "English",
    emoji: "📚",
    blurb: "Grammar, literature, and writing craft.",
    topics: [
      {
        id: "grammar",
        name: "Grammar",
        blurb: "Sentence structure and parts of speech.",
        questions: [
          { q: "Past tense of 'go'?", choices: ["goed", "gone", "went", "goes"], answer: 2, accept: ["went"] },
          { q: "In 'She sings beautifully,' which word is the adverb?", choices: ["She", "sings", "beautifully", "none"], answer: 2, accept: ["beautifully"] },
          { q: "Which is a complete sentence?", choices: ["Running in the park.", "She runs daily.", "Because of the rain.", "Although tired."], answer: 1, accept: ["b", "she runs daily"] },
          { q: "Plural of 'child'?", choices: ["childs", "childes", "children", "childen"], answer: 2, accept: ["children"] },
        ],
      },
      {
        id: "literature",
        name: "Literature",
        blurb: "Classic authors and works.",
        questions: [
          { q: "Who wrote 'Romeo and Juliet'?", choices: ["Charles Dickens", "William Shakespeare", "Mark Twain", "Jane Austen"], answer: 1, accept: ["shakespeare"] },
          { q: "Who wrote 'Pride and Prejudice'?", choices: ["Brontë", "Austen", "Woolf", "Eliot"], answer: 1, accept: ["austen", "jane austen"] },
          { q: "'The Great Gatsby' was written by?", choices: ["Hemingway", "Fitzgerald", "Faulkner", "Steinbeck"], answer: 1, accept: ["fitzgerald", "f scott fitzgerald"] },
          { q: "What POV uses 'I' and 'we'?", choices: ["First", "Second", "Third limited", "Third omniscient"], answer: 0, accept: ["first", "1st"] },
        ],
      },
      {
        id: "vocabulary",
        name: "Vocabulary",
        blurb: "Word meanings and figurative language.",
        questions: [
          { q: "A direct comparison without 'like' or 'as' is a ___.", choices: ["Metaphor", "Simile", "Hyperbole", "Onomatopoeia"], answer: 0, accept: ["metaphor"] },
          { q: "Synonym for 'arduous'?", choices: ["Easy", "Difficult", "Quick", "Bright"], answer: 1, accept: ["difficult", "hard"] },
          { q: "Antonym of 'benevolent'?", choices: ["Kind", "Malevolent", "Gentle", "Wise"], answer: 1, accept: ["malevolent"] },
          { q: "'Cacophony' means?", choices: ["Harmony", "Silence", "Harsh noise", "Sweet sound"], answer: 2, accept: ["harsh noise", "noise"] },
        ],
      },
    ],
  },
  {
    id: "science",
    name: "Science",
    emoji: "🔬",
    blurb: "Biology, chemistry, and physics.",
    topics: [
      {
        id: "biology",
        name: "Biology",
        blurb: "Cells, anatomy, and life.",
        questions: [
          { q: "Powerhouse of the cell?", choices: ["Nucleus", "Mitochondria", "Ribosome", "Golgi"], answer: 1, accept: ["mitochondria"] },
          { q: "How many bones in the adult human body?", choices: ["186", "206", "226", "246"], answer: 1, accept: ["206"] },
          { q: "Gas plants absorb for photosynthesis?", choices: ["O₂", "N₂", "CO₂", "H₂"], answer: 2, accept: ["co2", "carbon dioxide"] },
          { q: "DNA stands for?", choices: ["Deoxyribonucleic acid", "Dinucleic acid", "Diribose acid", "Deoxy nucleic atom"], answer: 0, accept: ["deoxyribonucleic acid"] },
        ],
      },
      {
        id: "chemistry",
        name: "Chemistry",
        blurb: "Elements and reactions.",
        questions: [
          { q: "Chemical symbol for gold?", choices: ["Go", "Gd", "Au", "Ag"], answer: 2, accept: ["au"] },
          { q: "pH of pure water?", choices: ["5", "6", "7", "8"], answer: 2, accept: ["7"] },
          { q: "Atomic number of carbon?", choices: ["4", "6", "8", "12"], answer: 1, accept: ["6"] },
          { q: "H₂O is commonly known as?", choices: ["Salt", "Water", "Hydrogen", "Oxide"], answer: 1, accept: ["water"] },
        ],
      },
      {
        id: "physics",
        name: "Physics",
        blurb: "Forces, motion, and energy.",
        questions: [
          { q: "Speed of light (m/s)?", choices: ["3×10⁵", "3×10⁶", "3×10⁸", "3×10¹⁰"], answer: 2, accept: ["3e8", "3x10^8", "299792458"] },
          { q: "Newton's 2nd law as an equation:", choices: ["F = ma", "E = mc²", "P = IV", "V = IR"], answer: 0, accept: ["f=ma", "f = ma"] },
          { q: "Unit of electric current?", choices: ["Volt", "Watt", "Ampere", "Ohm"], answer: 2, accept: ["ampere", "amp", "amps"] },
          { q: "Largest planet in our solar system?", choices: ["Saturn", "Jupiter", "Neptune", "Earth"], answer: 1, accept: ["jupiter"] },
        ],
      },
    ],
  },
  {
    id: "sst",
    name: "Social Studies",
    emoji: "🌍",
    blurb: "History, geography, and civics.",
    topics: [
      {
        id: "history",
        name: "History",
        blurb: "World-changing events and people.",
        questions: [
          { q: "First President of the USA?", choices: ["Lincoln", "Jefferson", "Washington", "Adams"], answer: 2, accept: ["washington", "george washington"] },
          { q: "Year WWII ended?", choices: ["1942", "1945", "1948", "1950"], answer: 1, accept: ["1945"] },
          { q: "Year the Berlin Wall fell?", choices: ["1979", "1985", "1989", "1991"], answer: 2, accept: ["1989"] },
          { q: "Industrial Revolution began in which country?", choices: ["USA", "Germany", "Britain", "France"], answer: 2, accept: ["britain", "uk", "england"] },
        ],
      },
      {
        id: "geography",
        name: "Geography",
        blurb: "Countries, capitals, and landforms.",
        questions: [
          { q: "Longest river in the world?", choices: ["Amazon", "Nile", "Yangtze", "Mississippi"], answer: 1, accept: ["nile"] },
          { q: "Capital of Japan?", choices: ["Kyoto", "Osaka", "Tokyo", "Seoul"], answer: 2, accept: ["tokyo"] },
          { q: "On which continent is the Sahara desert?", choices: ["Asia", "Africa", "Australia", "South America"], answer: 1, accept: ["africa"] },
          { q: "Smallest country in the world?", choices: ["Monaco", "Vatican City", "Nauru", "San Marino"], answer: 1, accept: ["vatican", "vatican city"] },
        ],
      },
      {
        id: "civics",
        name: "Civics",
        blurb: "Government and citizenship.",
        questions: [
          { q: "US branch that makes laws?", choices: ["Executive", "Legislative", "Judicial", "Federal"], answer: 1, accept: ["legislative", "congress"] },
          { q: "How many US senators per state?", choices: ["1", "2", "3", "5"], answer: 1, accept: ["2", "two"] },
          { q: "Document that begins 'We the People'?", choices: ["Declaration of Independence", "Constitution", "Bill of Rights", "Federalist Papers"], answer: 1, accept: ["constitution", "the constitution"] },
          { q: "Minimum age to be US President?", choices: ["25", "30", "35", "40"], answer: 2, accept: ["35"] },
        ],
      },
    ],
  },
  {
    id: "bible",
    name: "Bible",
    emoji: "✝️",
    blurb: "Old and New Testament scripture knowledge.",
    topics: [
      {
        id: "old-testament",
        name: "Old Testament",
        blurb: "From Genesis to Malachi.",
        questions: [
          { q: "First book of the Bible?", choices: ["Exodus", "Genesis", "Psalms", "Matthew"], answer: 1, accept: ["genesis"] },
          { q: "Who led the Israelites out of Egypt?", choices: ["Abraham", "Moses", "David", "Joshua"], answer: 1, accept: ["moses"] },
          { q: "On which day did God rest?", choices: ["5th", "6th", "7th", "8th"], answer: 2, accept: ["7", "seventh"] },
          { q: "Who built the ark?", choices: ["Moses", "Abraham", "Noah", "Adam"], answer: 2, accept: ["noah"] },
        ],
      },
      {
        id: "new-testament",
        name: "New Testament",
        blurb: "Gospels, Acts, and epistles.",
        questions: [
          { q: "How many disciples did Jesus choose?", choices: ["7", "10", "12", "14"], answer: 2, accept: ["12", "twelve"] },
          { q: "Who baptized Jesus?", choices: ["Peter", "John the Baptist", "Paul", "Andrew"], answer: 1, accept: ["john", "john the baptist"] },
          { q: "Who wrote most NT letters?", choices: ["Peter", "John", "Paul", "James"], answer: 2, accept: ["paul"] },
          { q: "First Gospel in the NT?", choices: ["Mark", "Matthew", "Luke", "John"], answer: 1, accept: ["matthew"] },
        ],
      },
      {
        id: "general",
        name: "General Knowledge",
        blurb: "Bible facts and trivia.",
        questions: [
          { q: "How many books in the Protestant Bible?", choices: ["46", "60", "66", "72"], answer: 2, accept: ["66"] },
          { q: "Shortest verse in the KJV Bible?", choices: ["John 3:16", "Jesus wept.", "God is love.", "Pray always."], answer: 1, accept: ["jesus wept"] },
          { q: "What language was most of the OT written in?", choices: ["Greek", "Latin", "Hebrew", "Aramaic"], answer: 2, accept: ["hebrew"] },
          { q: "How many commandments did Moses receive?", choices: ["7", "10", "12", "40"], answer: 1, accept: ["10", "ten"] },
        ],
      },
    ],
  },
];

export const getSubject = (id: string) => SUBJECTS.find((s) => s.id === id);
export const getTopic = (subjectId: string, topicId: string) =>
  getSubject(subjectId)?.topics.find((t) => t.id === topicId);

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
