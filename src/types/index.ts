export interface RawTranscript {
  reviewId: string;
  brand: string;
  personId: string;
  productId: string;
  createdAt: string;
  votes: Array<{ product: { id: string; name: string }; rating: number }>;
  wouldBuy: Array<{ wouldBuyAfterTrying?: string; wouldBuyInTheFirstPlace?: string }>;
  transcription: {
    text: string;
    summary: string;
    sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'MIXED';
    wordCount: number;
  } | null;
}

export interface RawUser {
  personId: string;
  reviewId: string;
  brand: string;
  firstName: string;
  lastName: string;
  age: string;
  gender: string;
  region: string;
  videoReviewerTier: string;
  archetypes: Array<{ name: string; order: number }>;
  tags: string[];
  questions: Array<{ id: string; title: string; answers: Array<{ id: string; text: string }> }>;
}

export interface RawProduct {
  productId: string;
  productName: string;
  brand: string;
  price: number;
  'market_position.price_tier': string;
  description: string;
  ingredients: string;
  subcategory: string;
  'market_position.market_maturity': string;
  'market_position.seasonality': string;
  retailers_available: string;
  target_user_1_segment: string;
  target_user_1_motivation: string;
  target_user_2_segment: string;
  target_user_2_motivation: string;
  usage_1_scenario: string;
  usage_2_scenario: string;
  labels: string;
  pack_size: string;
}

export interface RawBrand {
  brand_name: string;
  momentum_score: number;
  popularity_score: number;
  breakthrough_score: number;
  description: string;
  archetype_affinity: string;
  research_overall_assessment: string;
  founded_year: number;
  hq_city: string;
}

export interface ReviewIntelligence {
  reviewId: string;
  transcript: string;
  summary: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  rating: number;
  purchaseIntent: boolean;
  product: RawProduct | null;
  brand: RawBrand | null;
  user: RawUser | null;
  archetype: string;
}

export interface ExtractedSignal {
  type: 'theme' | 'driver' | 'complaint' | 'occasion' | 'competitor';
  label: string;
  evidenceQuote: string;
  productId: string;
  brand: string;
  confidence: number;
}

export interface ThemeSummary {
  theme: string;
  count: number;
  avgRating: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  topQuote: string;
  brands: string[];
}

export interface BrandInsight {
  brandName: string;
  momentum: number;
  popularity: number;
  breakthrough: number;
  avgRating: number;
  avgSentimentScore: number;
  reviewCount: number;
  topThemes: string[];
  positioning: string;
}

export interface ProductInsight {
  productId: string;
  productName: string;
  brand: string;
  priceGBP: number;
  priceTier: string;
  positioning: string;
  avgRating: number;
  sentimentScore: number;
  reviewCount: number;
  topThemes: string[];
  claimsVsReality: string;
}

export interface Opportunity {
  id: string;
  title: string;
  explanation: string;
  evidence: string[];
  impactedBrands: string[];
  impactedProducts: string[];
  type: 'occasion' | 'price' | 'complaint' | 'segment' | 'positioning';
}