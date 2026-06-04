'use client';

import { useEffect, useState, useMemo } from 'react';
import { loadAllData, loadAllBrands } from '@/lib/data/loader';
import { extractSignals, buildBrandInsights } from '@/lib/insights/extractor';
import { BrandInsight, RawBrand } from '@/types';

export default function BrandsPage() {
  const [brandInsights, setBrandInsights] = useState<BrandInsight[]>([]);
  const [allBrands, setAllBrands] = useState<RawBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'reviewCount' | 'avgRating' | 'momentum' | 'popularity' | 'breakthrough'>('reviewCount');
const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');

  useEffect(() => {
    Promise.all([loadAllData(), loadAllBrands()]).then(([reviews, brands]) => {
      const signals = extractSignals(reviews);
      setBrandInsights(buildBrandInsights(reviews, signals));
      setAllBrands(brands);
      setLoading(false);
    });
  }, []);

  const sorted = useMemo(() => {
  return [...brandInsights].sort((a, b) => sortDir === 'desc' ? b[sortBy] - a[sortBy] : a[sortBy] - b[sortBy]);
}, [brandInsights, sortBy, sortDir]);

  const topBrand = sorted[0];
  const bottomBrand = sorted[sorted.length - 1];

  const catalogueBrands = allBrands.filter(
    b => !brandInsights.find(bi => bi.brandName.toLowerCase() === b.brand_name.toLowerCase())
  );

  if (loading) return <LoadingScreen />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Brand Intelligence</h1>
        <p className="text-gray-400 mt-1">Compare brands across momentum, popularity, breakthrough and consumer sentiment</p>
      </div>

      {/* Top / Bottom performers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {topBrand && (
          <div className="bg-emerald-950 border border-emerald-700 rounded-xl p-5">
            <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wide mb-2">⭐ Top Performer</p>
            <h3 className="text-xl font-bold text-white">{topBrand.brandName}</h3>
            <p className="text-sm text-gray-300 mt-1">{topBrand.reviewCount} reviews · ⭐ {topBrand.avgRating} avg rating</p>
            <p className="text-xs text-gray-400 mt-2 line-clamp-2">{topBrand.positioning}</p>
            <div className="flex gap-2 mt-3 flex-wrap">
              {topBrand.topThemes.map(t => (
                <span key={t} className="text-xs bg-emerald-900 text-emerald-300 px-2 py-0.5 rounded-full capitalize">{t}</span>
              ))}
            </div>
          </div>
        )}
        {bottomBrand && bottomBrand.brandName !== topBrand?.brandName && (
          <div className="bg-red-950 border border-red-800 rounded-xl p-5">
            <p className="text-xs text-red-400 font-semibold uppercase tracking-wide mb-2">⚠ Needs Attention</p>
            <h3 className="text-xl font-bold text-white">{bottomBrand.brandName}</h3>
            <p className="text-sm text-gray-300 mt-1">{bottomBrand.reviewCount} reviews · ⭐ {bottomBrand.avgRating} avg rating</p>
            <p className="text-xs text-gray-400 mt-2">{bottomBrand.positioning}</p>
            <div className="flex gap-2 mt-3 flex-wrap">
              {bottomBrand.topThemes.map(t => (
                <span key={t} className="text-xs bg-red-900 text-red-300 px-2 py-0.5 rounded-full capitalize">{t}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sort controls */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex flex-wrap gap-3 items-center">
        <span className="text-sm text-gray-400">Sort by:</span>
        {(['reviewCount', 'avgRating', 'momentum', 'popularity', 'breakthrough'] as const).map(key => (
  <button
    key={key}
    onClick={() => setSortBy(key)}
    className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
      sortBy === key
        ? 'bg-emerald-600 text-white'
        : 'bg-gray-800 text-gray-400 hover:text-white'
    }`}
  >
    {key === 'reviewCount' ? 'Reviews' :
     key === 'avgRating' ? 'Rating' :
     key.charAt(0).toUpperCase() + key.slice(1)}
  </button>
))}
<button
  onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
  className="text-sm px-3 py-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors ml-2"
>
  {sortDir === 'desc' ? '↓ High to Low' : '↑ Low to High'}
</button>
      </div>

      {/* Brand Cards */}
      <div className="space-y-4">
        {sorted.map((brand, index) => (
          <div key={brand.brandName} className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-gray-600">#{index + 1}</span>
                <div>
                  <h3 className="font-bold text-white text-lg">{brand.brandName}</h3>
                  <p className="text-xs text-gray-400 max-w-lg line-clamp-2">{brand.positioning}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-emerald-400">{brand.reviewCount} reviews</p>
                <p className="text-xs text-gray-400">⭐ {brand.avgRating} avg</p>
              </div>
            </div>

            {/* Performance Scores */}
            <div className="grid grid-cols-3 gap-3">
  <ScoreBar label="Momentum" value={brand.momentum} color="emerald" description="YoY growth" />
  <ScoreBar label="Popularity" value={brand.popularity} color="blue" description="Category presence" />
  <ScoreBar label="Breakthrough" value={brand.breakthrough} color="violet" description="Size + growth blend" />
            </div>  

            {/* Sentiment Score */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">Consumer Sentiment Score:</span>
              <span className={`text-sm font-semibold ${
                brand.avgSentimentScore > 0.3 ? 'text-emerald-400' :
                brand.avgSentimentScore < -0.3 ? 'text-red-400' :
                'text-gray-400'
              }`}>
                {brand.avgSentimentScore > 0.3 ? '😊 Positive' :
                 brand.avgSentimentScore < -0.3 ? '😞 Negative' :
                 '😐 Mixed'}
              </span>
              <span className="text-xs text-gray-600">({brand.avgSentimentScore.toFixed(2)})</span>
            </div>

            {/* Top Themes */}
            {brand.topThemes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-gray-500">Top themes:</span>
                {brand.topThemes.map(t => (
                  <span key={t} className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full capitalize">{t}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Catalogue brands with no reviews */}
      {catalogueBrands.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-white">Brands Without Reviews</h2>
          <p className="text-sm text-gray-400">These brands appear in the catalogue but have no consumer reviews yet</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {catalogueBrands.map(b => (
              <div key={b.brand_name} className="bg-gray-900 rounded-xl p-4 border border-dashed border-gray-700 space-y-2">
                <p className="font-medium text-sm text-gray-300">{b.brand_name}</p>
                <p className="text-xs text-gray-500">{b.description?.slice(0, 100)}</p>
                <div className="grid grid-cols-3 gap-1 text-xs text-gray-600">
                  <span>M: {b.momentum_score}</span>
                  <span>P: {b.popularity_score}</span>
                  <span>B: {b.breakthrough_score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreBar({ label, value, color, description }: { label: string; value: number; color: string; description?: string }) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    violet: 'bg-violet-500',
  };
  const pct = Math.min(Math.max(value, 0), 100);
  const strength = value >= 60 ? 'Strong' : value >= 35 ? 'Moderate' : 'Low';
  const strengthColor = value >= 60 ? 'text-emerald-400' : value >= 35 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="bg-gray-800 rounded-lg p-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400 font-medium">{label}</span>
        <span className="text-white font-semibold">{value}/100</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-1.5 mb-1">
        <div className={`h-1.5 rounded-full ${colors[color]}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-gray-600">{description}</span>
        <span className={`font-medium ${strengthColor}`}>{strength}</span>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Loading brand intelligence...</p>
      </div>
    </div>
  );
}