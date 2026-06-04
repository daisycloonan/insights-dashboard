'use client';

import { useEffect, useState, useMemo } from 'react';
import { loadAllData, loadAllProducts } from '@/lib/data/loader';
import { extractSignals, buildProductInsights } from '@/lib/insights/extractor';
import { ProductInsight, RawProduct, ReviewIntelligence } from '@/types';

function buildProductSummary(product: ProductInsight, reviews: ReviewIntelligence[]): string {
  const productReviews = reviews.filter(r => r.product?.productId === product.productId);
  if (productReviews.length === 0) return 'No review data available.';

  const total = productReviews.length;
  const positiveCount = productReviews.filter(r => r.sentiment === 'positive').length;
  const positivePct = Math.round((positiveCount / total) * 100);
  const intentCount = productReviews.filter(r => r.purchaseIntent).length;
  const intentPct = Math.round((intentCount / total) * 100);

  // Top archetype
  const archetypeCounts = productReviews.reduce<Record<string, number>>((acc, r) => {
    const a = r.archetype;
    if (a && a !== 'Unknown') acc[a] = (acc[a] ?? 0) + 1;
    return acc;
  }, {});
  const topArchetype = Object.entries(archetypeCounts).sort((a, b) => b[1] - a[1])[0];

  // Complaint signals
  const COMPLAINT_WORDS = ['disappointed', 'bad', 'terrible', 'awful', 'hate', 'too sweet', 'bland', 'weak', 'watery', 'overpriced'];
  const complaintCount = productReviews.filter(r =>
    COMPLAINT_WORDS.some(w => r.transcript.toLowerCase().includes(w))
  ).length;

  // Standout quotes — find most signal-rich sentence across all reviews
  const SIGNAL_WORDS = ['love', 'amazing', 'perfect', 'recommend', 'best', 'favourite', 'unique', 'different', 'refreshing', 'natural', 'healthy'];
  let bestSentence = '';
  let bestScore = 0;
  for (const review of productReviews) {
    const sentences = review.transcript.split(/[.!?]+/).map((s: string) => s.trim()).filter((s: string) => s.length > 30);
    for (const sentence of sentences) {
      const score = SIGNAL_WORDS.filter(w => sentence.toLowerCase().includes(w)).length;
      if (score > bestScore) {
        bestScore = score;
        bestSentence = sentence;
      }
    }
  }

  const parts: string[] = [];

  // Opening
  if (positivePct >= 90) {
    parts.push(`Strongly received across all ${total} reviews`);
  } else if (positivePct >= 70) {
    parts.push(`Generally positive across ${total} reviews (${positivePct}% positive)`);
  } else {
    parts.push(`Mixed reception across ${total} reviews (${positivePct}% positive)`);
  }

  // Archetype
  if (topArchetype) {
    const archetypePct = Math.round((topArchetype[1] / total) * 100);
    parts.push(`led by ${topArchetype[0].replace('The ', '')}s (${archetypePct}%)`);
  }

  // Top themes
  if (product.topThemes.length > 0) {
    parts.push(`${product.topThemes.slice(0, 2).join(' and ')} are the dominant consumer themes`);
  }

  // Complaints
  if (complaintCount >= 3) {
    parts.push(`${complaintCount} reviews flag friction points worth monitoring`);
  }

  // Repurchase
  if (intentPct >= 85) {
    parts.push(`${intentPct}% would repurchase — a strong commercial signal`);
  } else if (intentPct >= 60) {
    parts.push(`${intentPct}% expressed repurchase intent`);
  } else {
    parts.push(`only ${intentPct}% would repurchase — below category average`);
  }

  const opening = parts[0];
  const rest = parts.slice(1);
  return `${opening}, ${rest.join(', ')}.`;
}

export default function ProductsPage() {
  const [productInsights, setProductInsights] = useState<ProductInsight[]>([]);
const [allProducts, setAllProducts] = useState<RawProduct[]>([]);
const [reviews, setReviews] = useState<ReviewIntelligence[]>([]);
const [loading, setLoading] = useState(true);
  const [filterTier, setFilterTier] = useState('all');
  const [filterBrand, setFilterBrand] = useState('all');
  const [sortBy, setSortBy] = useState<'avgRating' | 'sentimentScore' | 'priceGBP' | 'reviewCount'>('reviewCount');
const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');

  useEffect(() => {
    Promise.all([loadAllData(), loadAllProducts()]).then(([data, products]) => {
  const signals = extractSignals(data);
  setProductInsights(buildProductInsights(data, signals));
  setAllProducts(products);
  setReviews(data);
  setLoading(false);
});
  }, []);

  const brands = useMemo(() => ['all', ...Array.from(new Set(productInsights.map(p => p.brand)))], [productInsights]);
  const tiers = ['all', 'budget', 'mid', 'premium'];

  const filtered = useMemo(() => {
  return productInsights
    .filter(p => filterTier === 'all' || p.priceTier === filterTier)
    .filter(p => filterBrand === 'all' || p.brand === filterBrand)
    .sort((a, b) => sortDir === 'desc' ? b[sortBy] - a[sortBy] : a[sortBy] - b[sortBy]);
}, [productInsights, filterTier, filterBrand, sortBy, sortDir]);

  const catalogueOnly = allProducts.filter(
    p => !productInsights.find(pi => pi.productId === p.productId)
  );

  if (loading) return <LoadingScreen />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Product Intelligence</h1>
        <p className="text-gray-400 mt-1">Compare products by sentiment, rating, price tier and consumer themes</p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Products Reviewed" value={productInsights.length.toString()} color="emerald" />
        <KPICard label="Catalogue Only" value={catalogueOnly.length.toString()} color="gray" />
        <KPICard
          label="Top Rated Product"
          value={productInsights.sort((a, b) => b.avgRating - a.avgRating)[0]?.productName ?? 'N/A'}
          color="blue"
          small
        />
        <KPICard
          label="Most Reviewed"
          value={productInsights.sort((a, b) => b.reviewCount - a.reviewCount)[0]?.productName ?? 'N/A'}
          color="violet"
          small
        />
      </div>

      {/* Filters */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex flex-wrap gap-3">
        <select
          value={filterBrand}
          onChange={e => setFilterBrand(e.target.value)}
          className="bg-gray-800 text-gray-100 rounded-lg px-4 py-2 text-sm border border-gray-700 focus:outline-none focus:border-emerald-500"
        >
          {brands.map(b => <option key={b} value={b}>{b === 'all' ? 'All Brands' : b}</option>)}
        </select>
        <select
          value={filterTier}
          onChange={e => setFilterTier(e.target.value)}
          className="bg-gray-800 text-gray-100 rounded-lg px-4 py-2 text-sm border border-gray-700 focus:outline-none focus:border-emerald-500"
        >
          {tiers.map(t => <option key={t} value={t}>{t === 'all' ? 'All Price Tiers' : t}</option>)}
        </select>
        <select
  value={sortBy}
  onChange={e => setSortBy(e.target.value as typeof sortBy)}
  className="bg-gray-800 text-gray-100 rounded-lg px-4 py-2 text-sm border border-gray-700 focus:outline-none focus:border-emerald-500"
>
  <option value="reviewCount">Sort by Reviews</option>
  <option value="avgRating">Sort by Rating</option>
  <option value="sentimentScore">Sort by Sentiment</option>
  <option value="priceGBP">Sort by Price</option>
</select>
<button
  onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
  className="bg-gray-800 text-gray-100 rounded-lg px-4 py-2 text-sm border border-gray-700 hover:border-emerald-500 transition-colors whitespace-nowrap"
>
  {sortDir === 'desc' ? '↓ High to Low' : '↑ Low to High'}
</button>
      </div>

      {/* Product Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map((product) => (
          <div key={product.productId} className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-white">{product.productName}</h3>
                <p className="text-sm text-gray-400">{product.brand}</p>
              </div>
              <PriceTierBadge tier={product.priceTier} price={product.priceGBP} />
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <Metric label="Avg Rating" value={`⭐ ${product.avgRating}`} />
              <Metric label="Sentiment" value={sentimentLabel(product.sentimentScore)} color={sentimentColor(product.sentimentScore)} />
              <Metric label="Reviews" value={`${product.reviewCount}`} />
            </div>

            {/* Top Themes */}
            {product.topThemes.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-2">Top Consumer Themes</p>
                <div className="flex flex-wrap gap-2">
                  {product.topThemes.map(theme => (
                    <span key={theme} className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full capitalize">{theme}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Claims vs Reality */}
            {/* AI Summary */}
<div className="bg-gray-800 rounded-lg p-3 border-l-4 border-emerald-700">
  <p className="text-xs text-emerald-400 font-semibold mb-1 uppercase tracking-wide">Product Summary</p>
  <p className="text-xs text-gray-300 leading-relaxed">{buildProductSummary(product, reviews)}</p>
</div>

{/* Claims vs Reality */}
<div className="bg-gray-800 rounded-lg p-3">
  <p className="text-xs text-gray-500 mb-1 font-medium">Claims vs Consumer Reality</p>
  <p className="text-xs text-gray-300 leading-relaxed">{product.claimsVsReality}</p>
</div>
          </div>
        ))}
      </div>

      {/* Catalogue Only Products */}
      {catalogueOnly.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-white">Catalogue-Only Products</h2>
          <p className="text-sm text-gray-400">These products have no reviews yet — useful for benchmarking and gap analysis</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {catalogueOnly.map(p => (
              <div key={p.productId} className="bg-gray-900 rounded-xl p-4 border border-dashed border-gray-700 space-y-2">
                <p className="font-medium text-sm text-gray-300">{p.productName}</p>
                <p className="text-xs text-gray-500">{p.brand} · £{p.price} · {p['market_position.price_tier']}</p>
                <p className="text-xs text-gray-600 italic">{p.description?.slice(0, 80)}...</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function sentimentLabel(score: number): string {
  if (score > 0.3) return '😊 Positive';
  if (score < -0.3) return '😞 Negative';
  return '😐 Neutral';
}

function sentimentColor(score: number): string {
  if (score > 0.3) return 'text-emerald-400';
  if (score < -0.3) return 'text-red-400';
  return 'text-gray-400';
}

function Metric({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-gray-800 rounded-lg p-3 text-center">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-sm font-semibold ${color ?? 'text-white'}`}>{value}</p>
    </div>
  );
}

function PriceTierBadge({ tier, price }: { tier: string; price: number }) {
  const styles: Record<string, string> = {
    budget: 'bg-gray-700 text-gray-300',
    mid: 'bg-blue-900 text-blue-300',
    premium: 'bg-violet-900 text-violet-300',
  };
  return (
    <div className="text-right">
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[tier] ?? styles.mid}`}>{tier}</span>
      <p className="text-sm font-bold text-white mt-1">£{price}</p>
    </div>
  );
}

function KPICard({ label, value, color, small }: { label: string; value: string; color: string; small?: boolean }) {
  const colors: Record<string, string> = {
    emerald: 'text-emerald-400',
    blue: 'text-blue-400',
    violet: 'text-violet-400',
    gray: 'text-gray-400',
  };
  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <p className="text-sm text-gray-400">{label}</p>
      <p className={`font-bold mt-1 ${colors[color]} ${small ? 'text-base' : 'text-3xl'}`}>{value}</p>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Loading product intelligence...</p>
      </div>
    </div>
  );
}