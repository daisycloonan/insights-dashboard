import Papa from 'papaparse';
import {
  RawTranscript,
  RawUser,
  RawProduct,
  RawBrand,
  ReviewIntelligence,
} from '@/types';

async function fetchJSON<T>(path: string): Promise<T[]> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
  return res.json();
}

async function fetchCSV<T>(path: string): Promise<T[]> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
  const text = await res.text();
  const result = Papa.parse<T>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });
  return result.data;
}

function normaliseSentiment(s: string): 'positive' | 'negative' | 'neutral' {
  const upper = s?.toUpperCase();
  if (upper === 'POSITIVE') return 'positive';
  if (upper === 'NEGATIVE') return 'negative';
  return 'neutral';
}

function extractRating(votes: RawTranscript['votes']): number {
  if (!votes || votes.length === 0) return 0;
  return Number(votes[0]?.rating ?? 0);
}

function extractPurchaseIntent(wouldBuy: RawTranscript['wouldBuy']): boolean {
  if (!wouldBuy || wouldBuy.length === 0) return false;
  return wouldBuy.some(
    w => w.wouldBuyAfterTrying === 'Yes' || w.wouldBuyInTheFirstPlace === 'Yes'
  );
}

function extractArchetype(user: RawUser | null): string {
  if (!user || !user.archetypes || user.archetypes.length === 0) return 'Unknown';
  const primary = user.archetypes.find(a => a.order === 1) ?? user.archetypes[0];
  return primary?.name ?? 'Unknown';
}

let cache: ReviewIntelligence[] | null = null;

export async function loadAllData(): Promise<ReviewIntelligence[]> {
  if (cache) return cache;

  const [transcripts, users, products, brands] = await Promise.all([
    fetchJSON<RawTranscript>('/data/transcripts.json'),
    fetchJSON<RawUser>('/data/users.json'),
    fetchCSV<RawProduct>('/data/products.csv'),
    fetchCSV<RawBrand>('/data/brands.csv'),
  ]);

  // Build lookup maps
  const userByReviewId = new Map<string, RawUser>();
  for (const user of users) {
    userByReviewId.set(user.reviewId, user);
  }

  const productById = new Map<string, RawProduct>();
  for (const product of products) {
  if (product.productId) {
    productById.set((product.productId + '').trim(), product);
  }
}

  const brandByName = new Map<string, RawBrand>();
  for (const brand of brands) {
  if (brand.brand_name) {
    brandByName.set((brand.brand_name + '').trim().toLowerCase(), brand);
  }
}

  const joined: ReviewIntelligence[] = transcripts
    .filter(t => t.transcription !== null)
    .map((t) => {
      const product = productById.get(t.productId) ?? null;
      const brandKey = ((t.brand ?? product?.brand ?? '') + '').trim().toLowerCase();
      const brand = brandByName.get(brandKey) ?? null;
      const user = userByReviewId.get(t.reviewId) ?? null;

      return {
        reviewId: t.reviewId,
        transcript: t.transcription!.text,
        summary: t.transcription!.summary,
        sentiment: normaliseSentiment(t.transcription!.sentiment),
        rating: extractRating(t.votes),
        purchaseIntent: extractPurchaseIntent(t.wouldBuy),
        product,
        brand,
        user,
        archetype: extractArchetype(user),
      };
    });

  cache = joined;
  return joined;
}

export async function loadAllProducts(): Promise<RawProduct[]> {
  return fetchCSV<RawProduct>('/data/products.csv');
}

export async function loadAllBrands(): Promise<RawBrand[]> {
  return fetchCSV<RawBrand>('/data/brands.csv');
}