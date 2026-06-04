# Working Log
## BevIntel — Beverage Brand Intelligence Dashboard
**Date:** 04 June 2026
**Time:** 10:00am – 2:00pm (approx. 4 hours)

---

## 10:00 — Read the brief and orient

Read through the brief and the data dictionary. First reaction was the large volume of available data and uncertainty how to pick a direction for my output.

First step was to run the brief through ChatGPT to get a broad read on approach, then use that output to write a more refined prompt for Claude to help build the application. Comparing the two outputs helped me clarify which signals were most commercially relevant before writing any code. Claude was far easier to use and much more accurate than ChatGPT.

Early ideas for structure:
- Overall summary of the 15 reviewed products
- Most positive / most negative reviews
- Charts summarising brand and product performance
- Product-specific deep dive view
- Time-based view (reviews over time)
- A deep-diving exploration tab
- A further steps / opportunities tab

Core tension: do I build a product-specific tool or something holistic covering the whole category? Decided to go holistic — five views covering overview, consumer voice, products, brands, and opportunities. In retrospect this was probably too ambitious for the project timeframe. A tighter two or three view app with more depth might have told a clearer narrative. Should have reassessed scope earlier rather than committing to all five views upfront.

---

## 10:15 — Stack choice and first false start

Decided on Next.js with TypeScript and Tailwind. Fast to scaffold, Vercel deployment is straightforward.

First attempt didn't go well — about 30 minutes in I'd started building page components before having a proper data layer. Scrapped it and started again more deliberately: data layer first, types second, insight extraction third, then pages. Rebuilding it from scratch with a clearer vision was one of most positively impactful decisions I made throughout the project and the new order paid off significantly.

---

## 10:45 — Data loading problems

App loaded but stuck on "Loading intelligence data..." with no UI error. Checked browser console — `TypeError: Cannot read properties of undefined (reading 'toLowerCase')` — brand name matching was calling `.toLowerCase()` on undefined values. Fixed with null safety guards.

Bigger issue: the CSV column names didn't match the code at all. Expected `momentum` but the file had `momentum_score`. Same for `popularity_score`, `breakthrough_score`, and `market_position.price_tier` as a dotted key. Also the JSON structure was more nested than anticipated — sentiment inside `transcription`, rating inside a `votes` array, purchase intent inside a `wouldBuy` array. Updated all types and loader mappings to match the actual data.

In retrospect, I should have better explored the actual file structure before writing any code.

---

## 11:15 — AI summaries and CORS

Wanted theme summaries on the overview page to say something like "most customers enjoyed the flavour but would prefer it non-alcoholic" rather than showing raw wordy quotes.

Tried calling the Anthropic API from the browser — CORS error immediately. Moved to a server-side Next.js API route. Route worked but returned 500 — Anthropic account needed credits.

Built a fully data-driven fallback while resolving this, using signal counts, sentiment breakdown, brand mention counts, and archetype data to construct natural language sentences without any API, which was a successful decision.

---

## 11:45 — Signal quality problems

**Opportunities page misreading transcripts** — "work" matching in "works well on its own", "afternoon" matching in casual mentions rather than genuine usage contexts. Switched from word-level to phrase-level matching ("at my desk", "wind down", "after the gym"). Evidence quotes were also too short — sometimes just one word. Fixed extractor to include surrounding sentence context.

**Too many tags on review cards** — some reviewers had 60+ behavioural tags completely cluttering the card. Limited to 4 with a "+N more" count.

**Theme bar counts wrong** — packaging showing 12 instead of 105 because the bar filter used different keywords than the signal extractor. Fixed by sharing one keyword map across both.

---

## 12:15 — Review summaries not insightful enough

Early key takeaways were pulling weak sentences or showing wordy direct quotes. Results were not insightful. Rebuilt the scoring algorithm to weight verdict and opinion language more heavily and penalise short sentences like 'Evening'.

Changed from direct quote to natural language summary — detecting signals and constructing a sentence describing what the reviewer actually concluded. Much more useful for a brand team skimming 129 reviews.

Repurchase intent tag was misfiring — firing on the boolean field from the data rather than the transcript text. Fixed to only fire when the transcript explicitly mentions repurchase language.

---

## 13:00 — Claims vs consumer reality not insightful enough

Initial version just showed the first 80 characters of the product description as "brand claims" — not specific or useful. Rebuilt to extract explicit claims from positioning text (health, natural, premium, mixer, functional) and compare against what consumers actually discuss, flagging alignment, gaps, and unexpected signals.

Added a product summary panel above the claims section giving a natural language overview of the product's review profile.

---

## 13:30 — Polish

- Brand scores showing 15 decimal places — rounded to 1dp, added strength labels and metric descriptions
- Active nav state not working — extracted nav to client component using `usePathname()`
- Dark background defaulting to white in light mode — hardcoded dark background in globals.css
- Added sort direction toggles (high to low / low to high) to products and brands pages

---

## 13:50 — Reflection

**What I'd do differently:**

Scope earlier. Five views in four hours meant each is functional and a holistic tool, but the tabs don't cohesively flow from one to the other, feel too detached and maybe overlap too much with some features. Could have been simpler structure with a hierachical deep-diving format to tuck bulky information away for quick reviews and key insights.

 I'd restructure BevIntel so the overview tells a cleaner 3–4 signal story and detail is contained inside expandable sections rather than displayed all at once. The current structure can obscure the headline takeaways behind too much information.

Should have explored the data structure more intentionally before writing any code. The column name mismatches and nested JSON issues costed some time in the start.

Should have planned more time for the opportunities page as this could potentially be the most useful element in the app.

**What worked:**

Data-driven summaries over API dependency — the app is fully functional without external services. The commercial framing ("what would a brand team actually want to know?") kept feature decisions focused and stopped it becoming a data viewer. Overview page achieves this well and there are lots of deep-diving options throughout. 