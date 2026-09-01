# Detective's Decree

Build a high-contrast dark-mode web application called "Sherlock Command Center" designed for projecting onto a screen during live detective club meetings.

Key Features & UI Layout:

1. Header / Navigation:

   - Club Title ("Sherlock Command Center") with a sleek gold/noir theme.

   - Global status indicator showing active case title and timer.

2. Case Briefing View (Main Dashboard):

   - Full-screen viewer for the Master Case File: crime scene overview narrative, initial police report, and a high-res evidence image gallery.

   - Interactive Scene Hotspots: Clickable points of interest on the main image/map that unlock hidden clues, documents, and physical evidence transcripts into the global case log.

3. Live AI Interrogation Terminal:

   - A drop-down menu to select from suspect profiles.

   - A prominent live chat log designed for class viewing with large, crisp typography.

   - An input field where a club member types questions to send to the AI suspect.

   - Include UI state settings to securely input a Google Gemini API Key.

4. Game Master Admin Console (Private Panel):

   - A creator form with an input box: "Enter a brief case concept (e.g., 'Stolen diamond at a museum gala')."

   - A button that uses AI to auto-generate: Suspect profiles (with hidden motives/alibis), physical clues, scene hotspots, and the exact true solution.

5. Verdict Console:

   - A final submission interface to enter the club's official verdict (Culprit, Motive, Weapon, Key Evidence).

   - Instant reveal screen showing whether the club cracked the case, along with a full case post-mortem logic breakdown.

Design Aesthetic: Sleek noir terminal style, deep charcoal background (#0f1117), crisp gold (#d4af37) accents, high legibility for projectors, clear section tabs.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://detective-command-terminal.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3365d95b-22af-4b34-97bc-8b9940202d96).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
