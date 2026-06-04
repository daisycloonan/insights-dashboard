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
  if (!res.ok) throw new Error(`Failed to fetch ${path}`);
  return res.json();
}

async function fetchCSV<T>(path: string): Promise<T[]> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to fetch ${path}`);
  const text = await res.text();
  const result = Papa.parse<T>(text, { header: true, skipEmptyLines: true, dynamicTyping: true });
  return result.data;
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
    productById.set(product.productId, product);
  }

  const brandByName = new Map<string, RawBrand>();
  for (const brand of brands) {
    brandByName.set(brand.brand_name.trim().toLowerCase(), brand);
  }

  // Join into unified ReviewIntelligence objects
  const joined: ReviewIntelligence[] = transcripts.map((t) => {
    const product = productById.get(t.productId) ?? null;
    const brandKey = t.brand?.trim().toLowerCase();
    const brand = brandByName.get(brandKey) ?? null;
    const user = userByReviewId.get(t.reviewId) ?? null;

    return {
      reviewId: t.reviewId,
      transcript: t.transcript,
      sentiment: t.sentiment,
      rating: Number(t.rating),
      purchaseIntent: t.purchaseIntent,
      product,
      brand,
      user,
    };
  });

  cache = joined;
  return joined;
}

// Helper: get all products including those without transcripts
export async function loadAllProducts(): Promise<RawProduct[]> {
  return fetchCSV<RawProduct>('/data/products.csv');
}

// Helper: get all brands
export async function loadAllBrands(): Promise<RawBrand[]> {
  return fetchCSV<RawBrand>('/data/brands.csv');
}
