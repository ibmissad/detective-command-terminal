import type { CaseFile, Hotspot } from "./case-types";

/* ------- deterministic hashing so every device derives the same puzzle ------- */
function hash(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/* ------------------------------- scene themes ------------------------------- */
export type SceneTheme = {
  id: "blueprint" | "suspect-board" | "forensic-lab" | "evidence-locker";
  name: string;
  tagline: string;
  overlay: string; // tailwind classes layered over the scene image
  frame: string;
};

const THEMES: SceneTheme[] = [
  {
    id: "blueprint",
    name: "Crime Scene Blueprint",
    tagline: "Structural survey · measured to scale",
    overlay:
      "bg-[linear-gradient(rgba(212,175,55,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.10)_1px,transparent_1px)] bg-[size:44px_44px] mix-blend-screen",
    frame: "ring-1 ring-inset ring-gold/30",
  },
  {
    id: "suspect-board",
    name: "Suspect Board",
    tagline: "Red string · connections pinned",
    overlay:
      "bg-[radial-gradient(circle_at_20%_25%,rgba(220,38,38,0.16),transparent_45%),radial-gradient(circle_at_78%_70%,rgba(220,38,38,0.12),transparent_40%)]",
    frame: "ring-1 ring-inset ring-destructive/30",
  },
  {
    id: "forensic-lab",
    name: "Forensic Lab Sweep",
    tagline: "UV pass · trace residue mapped",
    overlay:
      "bg-[radial-gradient(circle_at_50%_35%,rgba(56,189,248,0.16),transparent_55%)] mix-blend-screen",
    frame: "ring-1 ring-inset ring-sky-400/30",
  },
  {
    id: "evidence-locker",
    name: "Evidence Locker",
    tagline: "Chain of custody · bagged & tagged",
    overlay:
      "bg-[repeating-linear-gradient(135deg,rgba(212,175,55,0.07)_0_18px,transparent_18px_36px)]",
    frame: "ring-1 ring-inset ring-gold/25",
  },
];

export function sceneTheme(caseFile: CaseFile): SceneTheme {
  const text = `${caseFile.title} ${caseFile.overview}`.toLowerCase();
  if (/blood|body|murder|corpse|stab/.test(text)) return THEMES[2]!;
  if (/theft|stolen|heist|vault|diamond|museum/.test(text)) return THEMES[3]!;
  if (/blackmail|conspir|letter|rival|affair|betray/.test(text)) return THEMES[1]!;
  return THEMES[0]!;
}

/* ---------------------------- contextual scene cues --------------------------- */
export type CueKind =
  | "blood"
  | "note"
  | "terminal"
  | "weapon"
  | "print"
  | "time"
  | "key"
  | "trace";

const CUE_RULES: Array<[RegExp, CueKind]> = [
  [/blood|stain|splatter|wound/, "blood"],
  [/note|letter|paper|ledger|diary|document|torn/, "note"],
  [/computer|terminal|laptop|phone|screen|camera|code|encrypt/, "terminal"],
  [/knife|gun|blade|weapon|poison|candlestick|hammer|rope/, "weapon"],
  [/print|glove|hand|finger|smudge/, "print"],
  [/clock|watch|time|schedule|log/, "time"],
  [/key|lock|safe|vault|door|drawer/, "key"],
];

export function cueFor(spot: Hotspot): CueKind {
  const text = `${spot.label} ${spot.detail}`.toLowerCase();
  for (const [re, cue] of CUE_RULES) if (re.test(text)) return cue;
  return "trace";
}

/* -------------------------------- mini-puzzles -------------------------------- */
export type Puzzle =
  | { kind: "cipher"; prompt: string; shift: number; scrambled: string; answer: string }
  | { kind: "fingerprint"; prompt: string; target: string; options: string[]; answer: string }
  | { kind: "timeline"; prompt: string; options: string[]; answer: string };

const PRINT_GLYPHS = ["⌘ WHORL-3", "◍ LOOP-7", "⌾ ARCH-1", "◎ TENTED-5", "⊙ DELTA-9", "⌗ RIDGE-4"];

function caesar(word: string, shift: number) {
  return word.replace(/[a-z]/gi, (c) => {
    const base = c === c.toUpperCase() ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + shift) % 26) + base);
  });
}

function keyword(spot: Hotspot) {
  const words = spot.label.replace(/[^a-zA-Z ]/g, "").split(/\s+/).filter((w) => w.length > 3);
  return (words[words.length - 1] ?? "CLUE").toUpperCase();
}

export function puzzleFor(spot: Hotspot, index: number): Puzzle {
  const h = hash(spot.id + spot.label);
  const kind = (h + index) % 3;

  if (kind === 0) {
    const shift = 1 + (h % 5);
    const answer = keyword(spot);
    return {
      kind: "cipher",
      prompt: "Decipher the shifted evidence tag to open this point of interest.",
      shift,
      scrambled: caesar(answer, shift),
      answer,
    };
  }

  if (kind === 1) {
    const answer = PRINT_GLYPHS[h % PRINT_GLYPHS.length]!;
    const options = [...PRINT_GLYPHS]
      .sort((a, b) => hash(a + spot.id) - hash(b + spot.id))
      .slice(0, 3);
    if (!options.includes(answer)) options[0] = answer;
    return {
      kind: "fingerprint",
      prompt: "Match the latent print lifted here against the reference card.",
      target: answer,
      options: options.sort((a, b) => hash(b + spot.label) - hash(a + spot.label)),
      answer,
    };
  }

  const baseHour = 19 + (h % 3);
  const minute = (h % 4) * 15;
  const fmt = (hr: number, mi: number) =>
    `${String(hr).padStart(2, "0")}:${String(mi).padStart(2, "0")}`;
  const answer = fmt(baseHour, minute);
  const options = [answer, fmt(baseHour - 1, (minute + 30) % 60), fmt(baseHour + 1, (minute + 45) % 60)].sort(
    (a, b) => hash(a + spot.id) - hash(b + spot.id),
  );
  return {
    kind: "timeline",
    prompt: `Cross-reference the duty log: the gap in the record sits ${
      minute === 0 ? "on the hour" : `${minute} minutes past the hour`
    }, between ${baseHour - 1}:00 and ${baseHour + 1}:00. Pick the exact timestamp.`,
    options,
    answer,
  };
}
