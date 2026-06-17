export type Question = {
  q: string;
  choices: string[];
  answer: number; // index
};

export type Subject = {
  id: string;
  name: string;
  emoji: string;
  blurb: string;
  questions: Question[];
};

export const SUBJECTS: Subject[] = [
  {
    id: "math",
    name: "Math",
    emoji: "➗",
    blurb: "Algebra, geometry, and a sprinkle of calculus.",
    questions: [
      { q: "Solve: 2x + 6 = 20", choices: ["x = 6", "x = 7", "x = 8", "x = 10"], answer: 1 },
      { q: "What is the value of √144?", choices: ["10", "11", "12", "14"], answer: 2 },
      { q: "Slope of a line through (1,2) and (3,8)?", choices: ["2", "3", "4", "6"], answer: 1 },
      { q: "sin(30°) = ?", choices: ["1/2", "√2/2", "√3/2", "1"], answer: 0 },
      { q: "Sum of interior angles of a hexagon?", choices: ["360°", "540°", "720°", "900°"], answer: 2 },
      { q: "Derivative of x²?", choices: ["x", "2x", "x²/2", "2"], answer: 1 },
      { q: "log₁₀(1000) = ?", choices: ["2", "3", "10", "100"], answer: 1 },
      { q: "If f(x) = 3x − 4, find f(5).", choices: ["7", "11", "15", "19"], answer: 1 },
    ],
  },
  {
    id: "english",
    name: "English",
    emoji: "📚",
    blurb: "Grammar, literature, and writing craft.",
    questions: [
      { q: "Which is a complete sentence?", choices: ["Running in the park.", "She runs daily.", "Because of the rain.", "Although tired."], answer: 1 },
      { q: "What is the past tense of 'go'?", choices: ["goed", "gone", "went", "goes"], answer: 2 },
      { q: "Who wrote 'Romeo and Juliet'?", choices: ["Charles Dickens", "William Shakespeare", "Mark Twain", "Jane Austen"], answer: 1 },
      { q: "A metaphor is...", choices: ["A direct comparison", "A comparison using 'like' or 'as'", "An exaggeration", "A sound word"], answer: 0 },
      { q: "Pick the adverb: 'She sings beautifully.'", choices: ["She", "sings", "beautifully", "none"], answer: 2 },
      { q: "Synonym for 'arduous'?", choices: ["Easy", "Difficult", "Quick", "Bright"], answer: 1 },
      { q: "Which is a proper noun?", choices: ["city", "Paris", "river", "country"], answer: 1 },
      { q: "What POV uses 'I' and 'we'?", choices: ["First person", "Second person", "Third limited", "Third omniscient"], answer: 0 },
    ],
  },
  {
    id: "science",
    name: "Science",
    emoji: "🔬",
    blurb: "Biology, chemistry, and physics fundamentals.",
    questions: [
      { q: "Chemical symbol for gold?", choices: ["Go", "Gd", "Au", "Ag"], answer: 2 },
      { q: "Powerhouse of the cell?", choices: ["Nucleus", "Mitochondria", "Ribosome", "Golgi"], answer: 1 },
      { q: "Speed of light (approx)?", choices: ["3×10⁵ m/s", "3×10⁶ m/s", "3×10⁸ m/s", "3×10¹⁰ m/s"], answer: 2 },
      { q: "Newton's 2nd law?", choices: ["F = ma", "E = mc²", "P = IV", "V = IR"], answer: 0 },
      { q: "How many bones in the adult human body?", choices: ["186", "206", "226", "246"], answer: 1 },
      { q: "Gas plants absorb for photosynthesis?", choices: ["O₂", "N₂", "CO₂", "H₂"], answer: 2 },
      { q: "pH of pure water?", choices: ["5", "6", "7", "8"], answer: 2 },
      { q: "Largest planet in our solar system?", choices: ["Saturn", "Jupiter", "Neptune", "Earth"], answer: 1 },
    ],
  },
  {
    id: "sst",
    name: "Social Studies",
    emoji: "🌍",
    blurb: "History, geography, and civics.",
    questions: [
      { q: "Longest river in the world?", choices: ["Amazon", "Nile", "Yangtze", "Mississippi"], answer: 1 },
      { q: "Who was the first President of the USA?", choices: ["Lincoln", "Jefferson", "Washington", "Adams"], answer: 2 },
      { q: "Continent of the Sahara desert?", choices: ["Asia", "Africa", "Australia", "S. America"], answer: 1 },
      { q: "Capital of Japan?", choices: ["Kyoto", "Osaka", "Tokyo", "Seoul"], answer: 2 },
      { q: "Year WWII ended?", choices: ["1942", "1945", "1948", "1950"], answer: 1 },
      { q: "Three branches of US government?", choices: ["Federal, state, local", "Executive, legislative, judicial", "House, Senate, Court", "Army, Navy, AF"], answer: 1 },
      { q: "Berlin Wall fell in...", choices: ["1979", "1985", "1989", "1991"], answer: 2 },
      { q: "Smallest country in the world?", choices: ["Monaco", "Vatican City", "Nauru", "San Marino"], answer: 1 },
    ],
  },
  {
    id: "bible",
    name: "Bible",
    emoji: "✝️",
    blurb: "Scripture knowledge from the Old and New Testament.",
    questions: [
      { q: "How many books are in the Bible (Protestant)?", choices: ["46", "60", "66", "72"], answer: 2 },
      { q: "First book of the Bible?", choices: ["Exodus", "Genesis", "Psalms", "Matthew"], answer: 1 },
      { q: "Who led the Israelites out of Egypt?", choices: ["Abraham", "Moses", "David", "Joshua"], answer: 1 },
      { q: "How many disciples did Jesus choose?", choices: ["7", "10", "12", "14"], answer: 2 },
      { q: "Who baptized Jesus?", choices: ["Peter", "John the Baptist", "Paul", "Andrew"], answer: 1 },
      { q: "Shortest verse in the Bible (KJV)?", choices: ["John 3:16", "Jesus wept.", "God is love.", "Pray always."], answer: 1 },
      { q: "Author of most New Testament letters?", choices: ["Peter", "John", "Paul", "James"], answer: 2 },
      { q: "On which day did God rest?", choices: ["5th", "6th", "7th", "8th"], answer: 2 },
    ],
  },
];

export const getSubject = (id: string) => SUBJECTS.find((s) => s.id === id);
