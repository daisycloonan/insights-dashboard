// Raw data types (as loaded from files)
export interface RawTranscript {
  reviewId: string;
  productId: string;
  brand: string;
  transcript: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  rating: number;
  purchaseIntent: boolean;
  personId: string;
}

export interface RawUser {
  personId: string;
  reviewId: string;
  age: number;
  gender: string;
  region: string;
  archetype: string;
  tags: string[];
  behaviouralSignals: string[];
}

export interface RawProduct {
  productId: string;
  productName: string;
  brand: string;
  price: number;
  'market_position.price_tier': string;
  description: string;
  ingredients: string;
  'market_position.market_maturity': string;
  retailers_available: string;
  target_user_1_segment: string;
  target_user_2_segment: string;
  usage_1_scenario: string;
  usage_2_scenario: string;
  labels: string;
}

export interface RawBrand {
  brand_name: string;
  momentum_score: number;
  popularity_score: number;
  breakthrough_score: number;
  description: string;
  archetype_affinity: string;
  research_overall_assessment: string;
}

// Joined intelligence object
export interface ReviewIntelligence {
  reviewId: string;
  transcript: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  rating: number;
  purchaseIntent: boolean;
  product: RawProduct | null;
  brand: RawBrand | null;
  user: RawUser | null;
}

// Insight / signal types
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