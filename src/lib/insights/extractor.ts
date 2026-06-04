import {
  ReviewIntelligence,
  ExtractedSignal,
  ThemeSummary,
  BrandInsight,
  ProductInsight,
  Opportunity,
} from '@/types';

const THEME_KEYWORDS: Record<string, string[]> = {
  taste: ['taste', 'flavour', 'flavor', 'delicious', 'yummy', 'disgusting', 'bland', 'sweet', 'bitter', 'sour'],
  sweetness: ['sweet', 'sugar', 'syrupy', 'too sweet', 'not sweet', 'sweetness'],
  health: ['healthy', 'natural', 'organic', 'calories', 'sugar-free', 'low sugar', 'vitamins', 'clean', 'functional'],
  convenience: ['convenient', 'easy', 'portable', 'on the go', 'quick', 'grab', 'handy'],
  price: ['expensive', 'cheap', 'value', 'worth', 'price', 'cost', 'affordable', 'overpriced'],
  packaging: ['bottle', 'can', 'packaging', 'design', 'look', 'label', 'size'],
  energy: ['energy', 'caffeine', 'boost', 'focus', 'alert', 'tired', 'awake'],
  hydration: ['hydration', 'hydrating', 'thirst', 'refreshing', 'refresh', 'water'],
  socialising: ['party', 'friends', 'social', 'sharing', 'together', 'night out', 'gathering'],
  sport: ['gym', 'workout', 'sport', 'exercise', 'fitness', 'training', 'run', 'performance'],
};

const COMPLAINT_KEYWORDS = ['disappointed', 'bad', 'terrible', 'awful', 'hate', 'disgusting', 'overpriced', 'too sweet', 'bland', 'fake', 'artificial', 'weak', 'watery'];
const DRIVER_KEYWORDS = ['love', 'great', 'amazing', 'perfect', 'best', 'excellent', 'fantastic', 'recommend', 'repurchase', 'again'];
const OCCASION_KEYWORDS = ['morning', 'afternoon', 'evening', 'gym', 'work', 'school', 'party', 'lunch', 'dinner', 'breakfast', 'commute', 'weekend'];
const COMPETITOR_BRANDS = ['coca-cola', 'pepsi', 'red bull', 'monster', 'lucozade', 'innocent', 'volvic', 'ribena', 'fanta', 'sprite'];

function extractQuote(transcript: string, keywords: string[]): string {
  const sentences = transcript.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();
    if (keywords.some(k => lower.includes(k))) {
      return sentence.length > 120 ? sentence.slice(0, 120) + '...' : sentence;
    }
  }
  return sentences[0]?.slice(0, 120) ?? transcript.slice(0, 120);
}

function confidenceScore(transcript: string, keywords: string[]): number {
  const lower = transcript.toLowerCase();
  const matches = keywords.filter(k => lower.includes(k)).length;
  return Math.min(matches / 3, 1);
}

export function extractSignals(reviews: ReviewIntelligence[]): ExtractedSignal[] {
  const signals: ExtractedSignal[] = [];

  for (const review of reviews) {
    const text = review.transcript;
    if (!text) continue;
    const lower = text.toLowerCase();
    const productId = review.product?.productId ?? 'unknown';
    const brand = review.product?.brand ?? review.brand?.brand_name ?? 'unknown';

    for (const [theme, keywords] of Object.entries(THEME_KEYWORDS)) {
      if (keywords.some(k => lower.includes(k))) {
        signals.push({
          type: 'theme',
          label: theme,
          evidenceQuote: extractQuote(text, keywords),
          productId,
          brand,
          confidence: confidenceScore(text, keywords),
        });
      }
    }

    if (DRIVER_KEYWORDS.some(k => lower.includes(k))) {
      signals.push({
        type: 'driver',
        label: 'purchase driver',
        evidenceQuote: extractQuote(text, DRIVER_KEYWORDS),
        productId,
        brand,
        confidence: confidenceScore(text, DRIVER_KEYWORDS),
      });
    }

    if (COMPLAINT_KEYWORDS.some(k => lower.includes(k))) {
      signals.push({
        type: 'complaint',
        label: 'friction point',
        evidenceQuote: extractQuote(text, COMPLAINT_KEYWORDS),
        productId,
        brand,
        confidence: confidenceScore(text, COMPLAINT_KEYWORDS),
      });
    }

    for (const occasion of OCCASION_KEYWORDS) {
      if (lower.includes(occasion)) {
        signals.push({
          type: 'occasion',
          label: occasion,
          evidenceQuote: extractQuote(text, [occasion]),
          productId,
          brand,
          confidence: 0.7,
        });
      }
    }

    for (const competitor of COMPETITOR_BRANDS) {
      if (lower.includes(competitor)) {
        signals.push({
          type: 'competitor',
          label: competitor,
          evidenceQuote: extractQuote(text, [competitor]),
          productId,
          brand,
          confidence: 0.9,
        });
      }
    }
  }

  return signals;
}

export function summariseThemes(signals: ExtractedSignal[], reviews: ReviewIntelligence[]): ThemeSummary[] {
  const themeMap = new Map<string, {
    count: number;
    ratings: number[];
    quotes: string[];
    brands: Set<string>;
    sentiments: string[];
  }>();

  for (const signal of signals.filter(s => s.type === 'theme')) {
    if (!themeMap.has(signal.label)) {
      themeMap.set(signal.label, { count: 0, ratings: [], quotes: [], brands: new Set(), sentiments: [] });
    }
    const entry = themeMap.get(signal.label)!;
    entry.count++;
    entry.quotes.push(signal.evidenceQuote);
    entry.brands.add(signal.brand);

    const review = reviews.find(r => r.product?.productId === signal.productId);
    if (review) {
      entry.ratings.push(review.rating);
      entry.sentiments.push(review.sentiment);
    }
  }

  return Array.from(themeMap.entries()).map(([theme, data]) => {
    const avgRating = data.ratings.length > 0
      ? data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length
      : 0;
    const positiveCount = data.sentiments.filter(s => s === 'positive').length;
    const negativeCount = data.sentiments.filter(s => s === 'negative').length;
    const dominantSentiment = positiveCount >= negativeCount ? 'positive' : 'negative';

    return {
      theme,
      count: data.count,
      avgRating: Math.round(avgRating * 10) / 10,
      sentiment: dominantSentiment as 'positive' | 'negative' | 'neutral',
      topQuote: data.quotes[0] ?? '',
      brands: Array.from(data.brands),
    };
  }).sort((a, b) => b.count - a.count);
}

export function buildBrandInsights(reviews: ReviewIntelligence[], signals: ExtractedSignal[]): BrandInsight[] {
  const brandMap = new Map<string, {
    ratings: number[];
    sentiments: number[];
    themes: string[];
    brand: ReviewIntelligence['brand'];
  }>();

  for (const review of reviews) {
    const name = review.brand?.brand_name ?? review.product?.brand ?? 'Unknown';
    if (!brandMap.has(name)) {
      brandMap.set(name, { ratings: [], sentiments: [], themes: [], brand: review.brand });
    }
    const entry = brandMap.get(name)!;
    entry.ratings.push(review.rating);
    entry.sentiments.push(
      review.sentiment === 'positive' ? 1 : review.sentiment === 'negative' ? -1 : 0
    );
  }

  for (const signal of signals.filter(s => s.type === 'theme')) {
    const entry = brandMap.get(signal.brand);
    if (entry) entry.themes.push(signal.label);
  }

  return Array.from(brandMap.entries()).map(([brandName, data]) => {
    const avgRating = data.ratings.reduce((a, b) => a + b, 0) / (data.ratings.length || 1);
    const avgSentiment = data.sentiments.reduce((a, b) => a + b, 0) / (data.sentiments.length || 1);
    const themeCounts = data.themes.reduce<Record<string, number>>((acc, t) => {
      acc[t] = (acc[t] ?? 0) + 1;
      return acc;
    }, {});
    const topThemes = Object.entries(themeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([t]) => t);

    return {
      brandName,
      momentum: Number(data.brand?.momentum_score ?? 0),
      popularity: Number(data.brand?.popularity_score ?? 0),
      breakthrough: Number(data.brand?.breakthrough_score ?? 0),
      avgRating: Math.round(avgRating * 10) / 10,
      avgSentimentScore: Math.round(avgSentiment * 100) / 100,
      reviewCount: data.ratings.length,
      topThemes,
      positioning: data.brand?.description ?? 'No positioning data',
    };
  }).sort((a, b) => b.reviewCount - a.reviewCount);
}

export function buildProductInsights(reviews: ReviewIntelligence[], signals: ExtractedSignal[]): ProductInsight[] {
  const productMap = new Map<string, {
    ratings: number[];
    sentiments: number[];
    themes: string[];
    review: ReviewIntelligence;
  }>();

  for (const review of reviews) {
    const pid = review.product?.productId ?? 'unknown';
    if (!productMap.has(pid)) {
      productMap.set(pid, { ratings: [], sentiments: [], themes: [], review });
    }
    const entry = productMap.get(pid)!;
    entry.ratings.push(review.rating);
    entry.sentiments.push(
      review.sentiment === 'positive' ? 1 : review.sentiment === 'negative' ? -1 : 0
    );
  }

  for (const signal of signals.filter(s => s.type === 'theme')) {
    const entry = productMap.get(signal.productId);
    if (entry) entry.themes.push(signal.label);
  }

  return Array.from(productMap.entries()).map(([, data]) => {
    const { review } = data;
    const avgRating = data.ratings.reduce((a, b) => a + b, 0) / (data.ratings.length || 1);
    const avgSentiment = data.sentiments.reduce((a, b) => a + b, 0) / (data.sentiments.length || 1);
    const themeCounts = data.themes.reduce<Record<string, number>>((acc, t) => {
      acc[t] = (acc[t] ?? 0) + 1;
      return acc;
    }, {});
    const topThemes = Object.entries(themeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([t]) => t);

    const positioning = review.product?.description ?? '';
    const consumerThemes = topThemes.join(', ');
    const claimsVsReality = positioning
      ? `Brand claims: "${positioning.slice(0, 80)}..." | Consumer focus: ${consumerThemes || 'insufficient data'}`
      : `Consumer focus: ${consumerThemes || 'insufficient data'}`;

    return {
      productId: review.product?.productId ?? 'unknown',
      productName: review.product?.productName ?? 'Unknown Product',
      brand: review.product?.brand ?? 'Unknown',
      priceGBP: Number(review.product?.price ?? 0),
      priceTier: review.product?.['market_position.price_tier'] ?? 'unknown',
      positioning,
      avgRating: Math.round(avgRating * 10) / 10,
      sentimentScore: Math.round(avgSentiment * 100) / 100,
      reviewCount: data.ratings.length,
      topThemes,
      claimsVsReality,
    };
  }).sort((a, b) => b.reviewCount - a.reviewCount);
}

export function generateOpportunities(
  reviews: ReviewIntelligence[],
  signals: ExtractedSignal[],
  brandInsights: BrandInsight[],
  productInsights: ProductInsight[]
): Opportunity[] {
  const opportunities: Opportunity[] = [];

  // 1. Occasion mismatch
  const occasionSignals = signals.filter(s => s.type === 'occasion');
  const occasionByBrand = new Map<string, string[]>();
  for (const s of occasionSignals) {
    if (!occasionByBrand.has(s.brand)) occasionByBrand.set(s.brand, []);
    occasionByBrand.get(s.brand)!.push(s.label);
  }
  for (const [brand, occasions] of occasionByBrand.entries()) {
    const topOccasion = occasions[0];
    const brandData = brandInsights.find(b => b.brandName === brand);
    if (brandData && topOccasion && !brandData.positioning.toLowerCase().includes(topOccasion)) {
      opportunities.push({
        id: `occasion-${brand}`,
        title: `${brand} associated with "${topOccasion}" — not reflected in positioning`,
        explanation: `Consumers mention "${topOccasion}" frequently when reviewing ${brand} products, but this occasion is not prominent in brand positioning. This represents an untapped messaging opportunity.`,
        evidence: occasionSignals.filter(s => s.brand === brand).slice(0, 3).map(s => s.evidenceQuote),
        impactedBrands: [brand],
        impactedProducts: productInsights.filter(p => p.brand === brand).map(p => p.productName),
        type: 'occasion',
      });
    }
  }

  // 2. Price perception mismatch
  for (const product of productInsights) {
    const priceSignals = signals.filter(s => s.productId === product.productId && s.label === 'price');
    const complaintSignals = signals.filter(s => s.productId === product.productId && s.type === 'complaint');
    if (product.priceTier === 'premium' && complaintSignals.length > 1) {
      opportunities.push({
        id: `price-${product.productId}`,
        title: `Price-quality tension for ${product.productName}`,
        explanation: `${product.productName} is positioned as premium (£${product.priceGBP}) but has ${complaintSignals.length} complaint signals. Consumers may not feel the price is justified.`,
        evidence: [...priceSignals, ...complaintSignals].slice(0, 3).map(s => s.evidenceQuote),
        impactedBrands: [product.brand],
        impactedProducts: [product.productName],
        type: 'price',
      });
    }
  }

  // 3. Common complaints
  const complaintSignals = signals.filter(s => s.type === 'complaint');
  if (complaintSignals.length > 5) {
    opportunities.push({
      id: 'category-complaints',
      title: 'Widespread friction points across the category',
      explanation: `${complaintSignals.length} complaint signals detected across the category. Common friction points represent whitespace for brands that can credibly address them.`,
      evidence: complaintSignals.slice(0, 4).map(s => s.evidenceQuote),
      impactedBrands: [...new Set(complaintSignals.map(s => s.brand))],
      impactedProducts: [...new Set(complaintSignals.map(s => s.productId))],
      type: 'complaint',
    });
  }

  // 4. Underserved segments
  const archetypes = reviews.map(r => r.archetype).filter(Boolean);
  const archetypeCounts = archetypes.reduce<Record<string, number>>((acc, a) => {
    acc[a] = (acc[a] ?? 0) + 1;
    return acc;
  }, {});
  const underserved = Object.entries(archetypeCounts).filter(([, count]) => count <= 3);
  for (const [archetype] of underserved) {
    opportunities.push({
      id: `segment-${archetype}`,
      title: `Underserved consumer segment: ${archetype}`,
      explanation: `The "${archetype}" archetype appears in very few reviews, suggesting this segment is either not engaged or not well served by current products in the category.`,
      evidence: reviews
        .filter(r => r.archetype === archetype)
        .map(r => r.transcript.slice(0, 100)),
      impactedBrands: [...new Set(reviews
        .filter(r => r.archetype === archetype)
        .map(r => r.brand?.brand_name ?? ''))],
      impactedProducts: [],
      type: 'segment',
    });
  }

  return opportunities;
}