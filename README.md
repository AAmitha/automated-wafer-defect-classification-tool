# Automated Wafer Defect Classification Tool

A lightweight full-stack prototype that ingests mock wafer map imagery or ASCII grid data, renders it on an HTML5 canvas, and forwards the payload to Google Gemini 1.5 Flash for visual reasoning.

## Features
- Tailwind-powered UI with wafer canvas, ASCII editor, and live debug log.
- Random wafer anomaly simulator for quick demos.
- Node/Express proxy that keeps the Gemini API key server-side.
- Result card summarizes predicted defect class, confidence cue, and explanation.

## Setup
1. Install dependencies:
       npm install
2. Copy `.env.example` to `.env` and set `GEMINI_API_KEY` with a valid Google AI Studio key. Optionally change `PORT`.
3. Run the dev server:
       npm run dev
4. Visit `http://localhost:5174` (or your chosen port).

## Usage
- **Upload image**: Drag a PNG/JPG wafer map export. The tool previews it and enables Gemini analysis.
- **ASCII map**: Paste coordinates or character grids describing anomalies. These are appended to the Gemini prompt.
- **Simulate**: Generates random hotspots and a simple coordinate list funneled into the request.

## Notes
- The prototype uses the `gemini-1.5-flash` endpoint; swap to another model in `server.js` if desired.
- Canvas output is intentionally simple; extend `public/app.js` to overlay process layers or heatmaps.
- Gemini returns free-form text. The parser in `app.js` extracts key phrases heuristically—tighten it if you require structured JSON.

