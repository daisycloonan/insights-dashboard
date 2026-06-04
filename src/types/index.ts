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
  priceGBP: number;
  priceTier: 'budget' | 'mid' | 'premium';
  ingredients: string;
  positioning: string;
  usageOccasions: string;
  targetUsers: string;
  labels: string;
  retailers: string;
}

export interface RawBrand {
  brand_name: string;
  momentum: number;
  popularity: number;
  breakthrough: number;
  positioning: string;
  archetypes: string;
  socialMetrics: string;
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
  confidence: number; // 0–1
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