# BevIntel — Beverage Brand Intelligence Dashboard

A client-facing brand intelligence dashboard built from beverage product review, user, product, and brand data.

**Live URL:** https://insights-dashboard-pi.vercel.app
**GitHub:** https://github.com/daisycloonan/insights-dashboard

---

## What It Does

BevIntel turns four raw data files into a commercial insight tool for beverage brand, product, and category teams. It joins consumer voice signals (transcripts, ratings, user profiles) with retail and brand intelligence (product positioning, pricing, brand performance scores) to surface evidence-backed insights across five views.

---

## Setup Instructions

### Prerequisites
- Node.js 18 or higher
- npm

### Installation

```bash
git clone https://github.com/daisycloonan/insights-dashboard.git
cd insights-dashboard
npm install
```

### Data Files

The four data files are required to run the application. Place them in `public/data/`:

public/data/transcripts.json
public/data/users.json
public/data/products.csv
public/data/brands.csv

If your files are in your Downloads folder, run the following in PowerShell from the project root:

```powershell
Copy-Item "$env:USERPROFILE\Downloads\transcripts.json" -Destination "public\data\transcripts.json"
Copy-Item "$env:USERPROFILE\Downloads\users.json" -Destination "public\data\users.json"
Copy-Item "$env:USERPROFILE\Downloads\products.csv" -Destination "public\data\products.csv"
Copy-Item "$env:USERPROFILE\Downloads\brands.csv" -Destination "public\data\brands.csv"
```

### Optional Enhancement: Environment Variables
The application includes an optional Anthropic API integration for AI-generated theme summaries on the overview page. If you have an Anthropic API key, create a `.env.local` file in the project root:

ANTHROPIC_API_KEY=your_key_here

If no key is provided the application falls back to data-driven summaries automatically — all core functionality works without it.

### Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The app will redirect to `/overview`.

### Building for Production

```bash
npm run build
npm start
```

---
## Project Structure

```
src/
├── app/
│   ├── overview/          # KPI dashboard + theme analysis
│   ├── consumer-voice/    # Transcript explorer with filters
│   ├── products/          # Product comparison view
│   ├── brands/            # Brand benchmarking view
│   ├── opportunities/     # Insight-driven recommendations
│   └── api/
│       └── summarise/     # Server-side Anthropic API route
├── lib/
│   ├── data/
│   │   └── loader.ts      # Data loading and joining logic
│   └── insights/
│       └── extractor.ts   # Signal extraction and insight generation
├── types/
│   └── index.ts           # Shared TypeScript types
└── components/
    └── NavBar.tsx          # Active-state navigation
```

## Architecture

### Data Layer
`src/lib/data/loader.ts` loads all four files, normalises field names, and joins them into a unified `ReviewIntelligence` object per review. Products and brands without transcripts are preserved for competitive benchmarking.

### Insight Extraction
`src/lib/insights/extractor.ts` computes:
- **Theme signals** — keyword matching across 10 categories (taste, health, packaging, energy, hydration, etc.)
- **Occasion signals** — context-aware phrase matching to detect genuine usage occasions
- **Complaint and driver signals** — positive and negative sentiment keyword detection
- **Brand and product insights** — aggregated from review-level signals
- **Opportunities** — occasion mismatches, price tensions, complaint themes, underserved segments, and positioning gaps

### Pages
Each page is a client component that calls the data loader and insight extractor, then renders the results. The data loader caches results in memory to avoid repeated parsing.

---

## Approach and Tradeoffs

**Keyword-based extraction over ML** — chosen for explainability and speed. Every signal is backed by transcript evidence visible in the UI.

**Data-driven summaries** — natural language summaries are generated algorithmically from signal data rather than requiring an LLM, making the app fully functional without an API key.

**Partial transcript coverage is intentional** — 15 of 35 products have transcripts. The remaining 20 are displayed as catalogue-only entries used for pricing and positioning benchmarks.

**Not every field is used** — retailer availability, companion products, social media handles, and some enriched fields were deprioritised in favour of signals with stronger commercial relevance.

---

## AI Tool Usage

The brief was initially run through ChatGPT to generate a broad directional read, and that output was used to write a refined prompt for Claude to help scaffold and build the application. Claude was used as a coding assistant throughout development. All output was reviewed and tested against the actual dataset.

---

## What I Would Improve With More Time

- Restructure of each tab's purpose for increasing accessibility to the key insights and imporving the commercial narrative of the app for the brand teams
- Embeddings-based NLP for more accurate signal extraction
- Retailer sales data to weight insights by commercial impact
- Social listening data to validate transcript signals at scale
- Longitudinal review data to detect trends over time
- Competitor transcript data for full cross-brand comparison
- Export functionality for insight cards and filtered transcript sets
- Restructured information architecture with a cleaner overview narrative and detail tucked into expandable sections