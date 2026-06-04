# Submission Notes
## BevIntel — Beverage Brand Intelligence Dashboard
**Live URL:** https://insights-dashboard-pi.vercel.app
**GitHub:** https://github.com/daisycloonan/insights-dashboard

---

## What I Built

BevIntel is a client-facing brand intelligence dashboard that transforms four raw data files into a commercial insight tool for beverage brand teams. The application is structured around five views, each designed to answer a different commercial question:

- **Overview** — How is the category doing overall?
- **Consumer Voice** — What are consumers actually saying?
- **Products** — How are individual products performing?
- **Brands** — How do brands compare?
- **Opportunities** — What should a brand investigate or act on?

The application joins transcript, user, product, and brand data into a unified intelligence object, extracts themes and signals from transcript text, and surfaces evidence-backed insights throughout.

---

## Approach

My initial step was to run the brief through ChatGPT to get a broad read on possible directions, then use that output to write a more refined prompt for Claude to help scaffold and build the application. Comparing the two outputs helped clarify which signals in the data were most commercially relevant before writing any code.

The core framing decision was to treat this as a commercial intelligence tool rather than a data viewer. Every feature was designed to answer a question a brand, product, or category team would actually ask — not to display every available field.

---

## Main Views and Features

### Overview
The entry point for a commercial user. Surfaces:
- KPI cards: total reviews, average rating, purchase intent rate, positive sentiment rate
- A sentiment distribution bar across the full dataset
- A top consumer themes panel with segmented bars showing each brand's share of mentions per theme, average rating per theme, and a data-driven consensus summary
- A brands-by-review-volume panel showing top themes and average ratings per brand
- A key insights summary with three headline signals

The theme bars are colour-coded by brand (Fix8, Double Dutch, SKIP, UNAI) so a user can immediately see which brand is driving each theme — for example, that Fix8 leads health mentions while UNAI leads energy mentions.

### Consumer Voice
A searchable, filterable transcript explorer with filters for sentiment, brand, and consumer archetype. Above the review list, a dynamic summary panel updates in real time as filters change, showing sentiment breakdown, top themes, dominant archetype, average rating, and purchase intent rate for the current selection.

Each review card shows:
- A **Key Takeaway** — a natural language summary of the review's most commercially useful signal (e.g. "Reviewer had a mixed reaction, enjoyed the light taste profile, felt it works better as a mixer than a standalone drink, and was unsure about repurchasing")
- Signal tags: strong endorsement, critical feedback, competitor comparison, repurchase intent, functional benefits, sweetness feedback, price sensitivity, mixer use, standalone verdict
- Extracted theme and occasion tags
- A collapsible full transcript
- Up to 4 user behavioural tags with overflow count

### Products
A product comparison view filterable by brand and price tier, sortable by reviews, rating, sentiment, or price in either direction.

Each product card shows:
- Average rating, sentiment score, review count
- Top consumer themes
- A **Product Summary** — a natural language summary covering sentiment strength, dominant archetype, key themes, complaint signals, and repurchase intent rate
- A **Claims vs Consumer Reality** section comparing what the brand explicitly claims in positioning against what consumers actually discuss — highlighting alignment, gaps, and unexpected signals

Products with no transcript data are shown separately as catalogue-only entries for competitive benchmarking.

### Brands
A brand benchmarking view sortable by review volume, average rating, momentum, popularity, or breakthrough score in either direction.

Each brand card shows:
- Momentum, popularity, and breakthrough scores out of 100 with progress bars, metric descriptions, and strength labels (Strong / Moderate / Low)
- Consumer sentiment score derived from transcript data
- Top consumer themes
- Brand positioning description

Top performing and lowest performing brands are highlighted at the top of the page. Brands without transcript data are shown separately.

### Opportunities
An insight-driven recommendations page surfacing five types of commercial opportunity:

- **Occasion** — usage occasions consumers mention that aren't reflected in brand positioning
- **Price** — premium-positioned products with complaint signals suggesting a price-quality tension
- **Complaint** — recurring friction points across the category
- **Segment** — underrepresented consumer archetypes suggesting unserved audiences
- **Positioning** — mismatches between brand claims and consumer reality

Each opportunity includes an explanation, up to 3 supporting evidence quotes, and an expandable full review viewer showing the complete transcript, product, rating, sentiment, archetype, and purchase intent for the reviewer behind each quote.

---

## Key Insights Found in the Data

**Taste and packaging dominate across all brands** — with 122 and 105 mentions respectively, these are category-level themes rather than brand differentiators. Health (55 mentions) is where Fix8 stands apart most clearly.

**Fix8 leads on review volume and sentiment** — 44 reviews, 4.4 average rating, and strong health and gut health signals that align well with its positioning.

**UNAI leads the energy occasion** — 14 of 27 energy mentions belong to UNAI, more than double any other brand, despite energy not being the most prominent theme in its positioning copy.

**Double Dutch consumers skew social and occasion-driven** — evening wind-down, weekend treat, and mixer occasions emerge organically from transcript text, suggesting messaging opportunities beyond the current on-trade focus.

**Purchase intent is high across the category (84%)** — but complaint signals around sweetness level, aftertaste, and value for money suggest friction points that a brand addressing them credibly could turn into a differentiator.

**Premium positioning is not always validated by consumer voice** — several premium-priced products attract complaint signals, suggesting the price-quality story needs stronger justification in product messaging.

---

## How I Connected Transcript and Product/Brand Signals

The core data join is a unified `ReviewIntelligence` object combining:
- Transcript text, sentiment, rating, and purchase intent from `transcripts.json`
- Reviewer demographics, archetypes, and behavioural tags from `users.json`
- Product metadata, pricing, positioning, and usage scenarios from `products.csv`
- Brand performance scores and positioning from `brands.csv`

From this object, the insight extraction layer computes:
- **Theme signals** — keyword matching across 10 theme categories, scored by frequency and sentiment
- **Occasion signals** — context-aware phrase matching rather than naive word matching
- **Complaint and driver signals** — negative and positive keyword detection with transcript evidence
- **Claims vs reality** — comparing explicit brand positioning claims against themes consumers actually discuss
- **Positioning mismatches** — detecting where brand-level claims are not validated by transcript evidence

Catalogue-only products and brands are preserved throughout and used for competitive benchmarking on the products and brands pages.

---

## Assumptions and Tradeoffs

**Keyword-based signal extraction over ML** — chosen for explainability and speed. Every signal includes the transcript evidence that generated it. A production system would benefit from a fine-tuned classification model, but the keyword approach produces commercially useful and verifiable outputs within the project timeframe.

**Data-driven summaries over AI-generated ones** — the application includes an Anthropic API integration for theme summaries, but also a full data-driven fallback that produces genuinely useful insights without any API dependency. Given the small dataset, the heuristic approach performs well and keeps the app fully functional without external dependencies.

**Occasion detection uses phrase-level matching** — to avoid false positives. "Work" in "works well on its own" would incorrectly fire as a work occasion signal. Context-aware phrases like "at my desk" and "during work" are used instead.

**Prioritised information accessibility over exhaustive display** — the overview page was designed to give a commercial user the most important signals at a glance. Some fields (retailer availability, companion products, social handles) are not displayed but could be added in a future iteration.

**Scope was ambitious for the timeframe** — five views in four hours meant each view is functional but none is as deep as it could be. In retrospect, two or three views done with more depth and a clearer narrative flow would have made a stronger submission.

---

## AI Tool Usage

My approach was to build a quick version of the final output to use as a springboard and mould into what I wanted, almost like a working backwards approach, start with the output to reassess the input logic.
The brief was initially run through ChatGPT to generate a broad directional read, and that output was used to write a refined prompt for Claude to help scaffold and build the application. Claude was used throughout development as a coding assistant — helping with TypeScript types, data joining logic, insight extraction, and page components. Insight logic, data joins, and commercial framing decisions were directed and verified throughout.

---

## What I Would Improve With More Time

**Information architecture** — restructure so the overview page tells a cleaner 3–4 signal story, with detail tucked away inside expandable sections or drill-down views rather than displayed all at once. The current structure shows everything simultaneously which can obscure the headline takeaways.

**Stronger NLP** — replacing keyword matching with a lightweight embeddings-based classifier would improve signal accuracy, especially for nuanced signals like occasion detection and sentiment nuance.

**Additional data I would want:**
- **Longitudinal review data** — reviews over time would enable trend detection. Before the brief was sent, I assumed there would be a temporal aspect to the data. Insight into how a product is performing compared to previous periods would be my no.1 next step and would offer better context for the opportunities section.
- **Retailer sales data** — units sold per product per retailer would allow the dashboard to weight insights by commercial impact rather than review volume
- **Social media data** — mentions and sentiment from Instagram/TikTok could validate whether transcript signals reflect broader consumer behaviour
- **Competitor transcript data** — reviews of Trip, DASH, Hip Pop and other catalogue-only brands would unlock full competitive comparison, and better align the suggestions in the opportunities section with competitors.

**Richer opportunity engine** — with more data, opportunities could be ranked by estimated commercial impact rather than signal frequency. For instance, previous avenues pursued or access to current ideas the teams are working on.

**Export functionality** — allowing a user to export insight cards, opportunity summaries, or filtered transcript sets as PDFs for use in presentations or strategy documents.

**Data Verification** - I would maybe add a quick tool or maybe even an Excel spreadsheet to cross-check that the data was being pulled in correctly. For the timeframe of the project, I did this check using Claude.