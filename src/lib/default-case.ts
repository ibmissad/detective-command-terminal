import type { CaseFile } from "./case-types";

export const DEFAULT_CASE: CaseFile = {
  title: "The Blackwood Pocket Watch",
  overview:
    "At 11:48 PM, a storm broke over Blackwood House while the Reading Society held its annual winter salon. When the lamps came back on, the display case in the study stood shattered and the Blackwood pocket watch — a gold repeater worth a small fortune — was gone. Lord Blackwood was found unconscious beside the hearth, struck from behind. Four guests remained in the house; nobody left through the front door.",
  policeReport:
    "INCIDENT 4471-B / DIV. WHITEHALL\nTime of call: 12:06 AM. Responding officers found the study door unlocked and the window latch intact but wet on the inner sill. The display case glass was broken outward, not inward. A brass candlestick from the mantel was recovered on the rug, wiped clean. Lord Blackwood recalls only 'a smell of tobacco and rosewater' before the blow. No forced entry to the house. Household staff dismissed at 10:00 PM.",
  hotspots: [
    {
      id: "h1",
      x: 74,
      y: 55,
      label: "Shattered Display Case",
      detail:
        "Glass fragments lie mostly OUTSIDE the case, on the rug. The case was broken from within — someone already holding a key staged a burglary after the fact.",
    },
    {
      id: "h2",
      x: 49,
      y: 76,
      label: "Gold Chain on the Rug",
      detail:
        "The watch chain is here, snapped at the swivel — but not the watch. Whoever took it was in a hurry and pocketed only the piece that could be sold anonymously.",
    },
    {
      id: "h3",
      x: 39,
      y: 24,
      label: "Rain-Streaked Window",
      detail:
        "The latch is fastened from inside, yet the inner sill is soaked. The window was opened briefly during the storm — long enough to throw something out to the garden below.",
    },
    {
      id: "h4",
      x: 15,
      y: 22,
      label: "Oil Lamp on the Desk",
      detail:
        "Still burning when police arrived. The blackout was confined to the electrical circuit in the east wing — someone with knowledge of the fuse box arranged the darkness.",
    },
    {
      id: "h5",
      x: 20,
      y: 62,
      label: "Open Ledger",
      detail:
        "The estate ledger is open to a page of loans. Three entries in the last year, each in the same hand, each unpaid, each initialled 'M.V.'",
    },
    {
      id: "h6",
      x: 88,
      y: 30,
      label: "Mantel Photographs",
      detail:
        "A gap in the row of frames: one photograph is missing. Dust marks show it was removed tonight, not weeks ago.",
    },
  ],
  suspects: [
    {
      id: "s1",
      name: "Miss Marguerite Vane",
      role: "Blackwood's private secretary",
      publicBio:
        "Ten years in service to the family, keeper of the household keys and the estate ledger. Reserved, exacting, never late.",
      demeanor:
        "Cool and precise. Answers in short, complete sentences. Deflects with procedure and paperwork. Becomes clipped and formal when pressed about money.",
      hiddenMotive:
        "You forged three loans against the estate in your own initials, M.V., to cover your brother's debts. Blackwood found the discrepancy this evening and told you he would call his solicitor in the morning. You cut the east wing fuse, struck him with the candlestick, took the watch as the only untraceable asset, broke the case from inside to stage a burglary, and threw the missing photograph — which showed you holding the ledger — out of the window into the garden.",
      alibi:
        "You claim you were in the linen corridor counting silver when the lights failed. Nobody can confirm it. If cornered, you admit you 'passed by the study door' but insist it was already dark.",
      isCulprit: true,
    },
    {
      id: "s2",
      name: "Dr. Aurelius Finch",
      role: "Family physician",
      publicBio:
        "Attends Lord Blackwood twice a month. Smokes a heavy Latakia tobacco. Warm, talkative, faintly theatrical.",
      demeanor:
        "Genial and long-winded. Volunteers medical detail nobody asked for. Nervous laughter when accused.",
      hiddenMotive:
        "You have been quietly over-prescribing Blackwood's tonic and billing the estate twice. Embarrassing, ruinous to your practice — but you did not touch him tonight and you are terrified the ledger will be read aloud.",
      alibi:
        "You were on the terrace smoking when the lights failed; the footman saw your cigarette from the kitchen door. This is true.",
      isCulprit: false,
    },
    {
      id: "s3",
      name: "Mr. Julian Reeve",
      role: "Nephew and presumptive heir",
      publicBio:
        "Young, indebted, charming. Wears rosewater cologne. Arrived uninvited two hours before the salon.",
      demeanor:
        "Flippant, defensive, quick to accuse others. Turns every question back on the questioner.",
      hiddenMotive:
        "You came to beg your uncle for money and were refused in front of the guests. You went to the study to steal from his desk drawer — and found him already on the floor. You panicked and said nothing.",
      alibi:
        "You claim you were in the billiard room. You were in the study for ninety seconds, after the attack, and your cologne is why Blackwood remembers rosewater.",
      isCulprit: false,
    },
    {
      id: "s4",
      name: "Mrs. Odette Sable",
      role: "Antiquities dealer and salon guest",
      publicBio:
        "Appraised the Blackwood watch last spring and has wanted it ever since. Sharp-eyed, unsentimental.",
      demeanor:
        "Blunt and transactional. Treats interrogation as a negotiation. Never lies outright; simply declines to elaborate.",
      hiddenMotive:
        "You offered a private buyer for the watch last month and stand to earn a commission if it ever surfaces. You would happily buy it stolen — but you did not steal it.",
      alibi:
        "You were in the drawing room with two other guests for the whole blackout. Both will confirm it.",
      isCulprit: false,
    },
  ],
  clues: [
    {
      id: "c1",
      title: "Candlestick, wiped clean",
      detail:
        "No prints, but polish residue on the base matches the household silver cloth kept in the linen corridor.",
    },
    {
      id: "c2",
      title: "Fuse box tampering",
      detail:
        "The east wing fuse was pulled by hand, not blown. The box is behind a locked service door; three keys exist.",
    },
    {
      id: "c3",
      title: "Rosewater and tobacco",
      detail:
        "Two different guests account for the two smells — and neither smell belongs to the person who struck the blow.",
    },
  ],
  solution: {
    culprit: "Miss Marguerite Vane",
    motive: "Concealing forged loans initialled M.V. after Blackwood discovered the ledger discrepancy",
    weapon: "The brass candlestick from the mantel",
    keyEvidence:
      "Glass broken outward from inside the locked display case, plus the wiped candlestick carrying linen-corridor polish residue",
    breakdown:
      "The staging is the tell. Glass lying outside a case means it was struck from within — only a keyholder could have opened it first, and only three keys exist. The pulled (not blown) fuse behind a locked service door narrows those keys to the household staff, and the staff were dismissed at 10 PM, leaving Vane alone with access. The ledger supplies the motive: three unpaid loans initialled M.V. The wiped candlestick carries polish residue from the linen corridor, the exact place Vane claims she was standing. Finch's tobacco and Reeve's rosewater are honest red herrings: both men were in the study's orbit for their own guilty reasons, neither struck the blow. Sable wanted the watch but has two witnesses. The missing mantel photograph — thrown from the briefly opened window onto the wet garden — showed Vane holding the very ledger she needed nobody to read.",
  },
};
