export type Hotspot = {
  id: string;
  x: number; // percentage 0-100
  y: number;
  label: string;
  detail: string;
};

export type Suspect = {
  id: string;
  name: string;
  role: string;
  publicBio: string;
  demeanor: string;
  hiddenMotive: string;
  alibi: string;
  isCulprit: boolean;
};

export type Clue = {
  id: string;
  title: string;
  detail: string;
};

export type Solution = {
  culprit: string;
  motive: string;
  weapon: string;
  keyEvidence: string;
  breakdown: string;
};

export type CaseFile = {
  title: string;
  overview: string;
  policeReport: string;
  hotspots: Hotspot[];
  suspects: Suspect[];
  clues: Clue[];
  solution: Solution;
};

export type LogEntry = {
  id: string;
  ts: number;
  source: string;
  text: string;
};

export type ChatMessage = {
  id: string;
  role: "investigator" | "suspect";
  text: string;
};

export type Verdict = {
  culprit: string;
  motive: string;
  weapon: string;
  keyEvidence: string;
};
