'use client';

import { useEffect, useState } from 'react';
import { loadAllData } from '@/lib/data/loader';
import { extractSignals, summariseThemes, buildBrandInsights } from '@/lib/insights/extractor';
import { ReviewIntelligence, ThemeSummary, BrandInsight } from '@/types';

interface ThemeWithSummary extends ThemeSummary {
  consensusSummary?: string;
}

const THEME_KEYWORDS_MAP: Record<string, string[]> = {
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

const COMPLAINT_WORDS = ['disappointed', 'bad', 'terrible', 'awful', 'hate', 'disgusting', 'overpriced', 'too sweet', 'bland', 'fake', 'artificial', 'weak', 'watery'];

const brandColors: Record<string, string> = {
  'Double Dutch': 'bg-emerald-500',
  'Fix8': 'bg-blue-500',
  'SKIP': 'bg-violet-500',
  'UNAI': 'bg-amber-500',
};

function buildInsightSummary(theme: ThemeSummary, reviews: ReviewIntelligence[]): string {
  const keywords = THEME_KEYWORDS_MAP[theme.theme] ?? [theme.theme];

  const relevantReviews = reviews.filter(r => {
    const lower = r.transcript.toLowerCase();
    return keywords.some(k => lower.includes(k));
  });

  const brandCounts = relevantReviews.reduce<Record<string, number>>((acc, r) => {
    const b = r.product?.brand ?? r.brand?.brand_name ?? '';
    if (b) acc[b] = (acc[b] ?? 0) + 1;
    return acc;
  }, {});
  const topBrand = Object.entries(brandCounts).sort((a, b) => b[1] - a[1])[0];

  const positiveCount = relevantReviews.filter(r => r.sentiment === 'positive').length;
  const total = relevantReviews.length || 1;
  const positivePct = Math.round((positiveCount / total) * 100);

  const archetypeCounts = relevantReviews.reduce<Record<string, number>>((acc, r) => {
    const a = r.archetype;
    if (a && a !== 'Unknown') acc[a] = (acc[a] ?? 0) + 1;
    return acc;
  }, {});
  const topArchetype = Object.entries(archetypeCounts).sort((a, b) => b[1] - a[1])[0];

  const intentCount = relevantReviews.filter(r => r.purchaseIntent).length;
  const intentPct = Math.round((intentCount / total) * 100);

  const complaintCount = relevantReviews.filter(r =>
    COMPLAINT_WORDS.some(w => r.transcript.toLowerCase().includes(w))
  ).length;
  const hasTension = complaintCount >= 3;

  const parts: string[] = [];

  if (topBrand) {
    parts.push(`${topBrand[0]} leads with ${topBrand[1]} of ${theme.count} mentions`);
  }

  const negativePct = Math.round((relevantReviews.filter(r => r.sentiment === 'negative').length / total) * 100);
  if (negativePct >= 15) {
    parts.push(`though ${negativePct}% negative sentiment flags real friction`);
  } else {
    parts.push(`${positivePct}% positive sentiment`);
  }

  if (theme.avgRating > 0) {
    parts.push(`avg rating ${theme.avgRating}/5`);
  }

  if (intentPct > 70) {
    parts.push(`${intentPct}% would repurchase`);
  }

  if (topArchetype && topArchetype[0] !== 'The Wellness Seeker') {
    parts.push(`strongest with ${topArchetype[0].replace('The ', '')}`);
  } else if (topArchetype && topArchetype[1] >= Math.ceil(total * 0.4)) {
    parts.push(`dominantly Wellness Seeker-driven`);
  }

  return parts.join(' · ') + '.';
}

export default function OverviewPage() {
  const [reviews, setReviews] = useState<ReviewIntelligence[]>([]);
  const [themes, setThemes] = useState<ThemeWithSummary[]>([]);
  const [brandInsights, setBrandInsights] = useState<BrandInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData().then((data) => {
      const signals = extractSignals(data);
      const rawThemes = summariseThemes(signals, data);
      const withSummaries = rawThemes.map(theme => ({
        ...theme,
        consensusSummary: buildInsightSummary(theme, data),
      }));
      setReviews(data);
      setThemes(withSummaries);
      setBrandInsights(buildBrandInsights(data, signals));
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingScreen />;

  const totalReviews = reviews.length;
  const avgRating = (reviews.reduce((a, b) => a + b.rating, 0) / totalReviews).toFixed(2);
  const positiveCount = reviews.filter(r => r.sentiment === 'positive').length;
  const negativeCount = reviews.filter(r => r.sentiment === 'negative').length;
  const neutralCount = reviews.filter(r => r.sentiment === 'neutral').length;
  const purchaseIntentCount = reviews.filter(r => r.purchaseIntent).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Overview</h1>
        <p className="text-gray-400 mt-1">Category-level intelligence across all brands and products</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Total Reviews" value={totalReviews.toString()} sub="across all brands" color="emerald" />
        <KPICard label="Avg Rating" value={`${avgRating} / 5`} sub="across all products" color="blue" />
        <KPICard label="Purchase Intent" value={`${Math.round((purchaseIntentCount / totalReviews) * 100)}%`} sub={`${purchaseIntentCount} of ${totalReviews} reviewers`} color="violet" />
        <KPICard label="Positive Sentiment" value={`${Math.round((positiveCount / totalReviews) * 100)}%`} sub={`${negativeCount} negative · ${neutralCount} neutral`} color="amber" />
      </div>

      {/* Sentiment Bar */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h2 className="text-lg font-semibold mb-4">Sentiment Distribution</h2>
        <div className="flex rounded-full overflow-hidden h-6">
          <div
            className="bg-emerald-500 flex items-center justify-center text-xs font-bold"
            style={{ width: `${(positiveCount / totalReviews) * 100}%` }}
          >
            {Math.round((positiveCount / totalReviews) * 100)}%
          </div>
          <div
            className="bg-gray-500 flex items-center justify-center text-xs font-bold"
            style={{ width: `${(neutralCount / totalReviews) * 100}%` }}
          >
            {Math.round((neutralCount / totalReviews) * 100)}%
          </div>
          <div
            className="bg-red-500 flex items-center justify-center text-xs font-bold"
            style={{ width: `${(negativeCount / totalReviews) * 100}%` }}
          >
            {Math.round((negativeCount / totalReviews) * 100)}%
          </div>
        </div>
        <div className="flex gap-6 mt-3 text-sm text-gray-400">
          <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />Positive</span>
          <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-gray-500 inline-block" />Neutral</span>
          <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" />Negative</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Themes */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h2 className="text-lg font-semibold mb-4">Top Consumer Themes</h2>
          <div className="space-y-5">
            {themes.slice(0, 6).map((theme) => {
              const keywords = THEME_KEYWORDS_MAP[theme.theme] ?? [theme.theme];
              const brandCounts = reviews
                .filter(r => {
                  const lower = r.transcript.toLowerCase();
                  return keywords.some(k => lower.includes(k));
                })
                .reduce<Record<string, number>>((acc, r) => {
                  const b = r.product?.brand ?? r.brand?.brand_name ?? 'Unknown';
                  acc[b] = (acc[b] ?? 0) + 1;
                  return acc;
                }, {});
              const total = Object.values(brandCounts).reduce((a, b) => a + b, 0);

              return (
                <div key={theme.theme}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="capitalize font-medium text-sm">{theme.theme}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">⭐ {theme.avgRating}/5</span>
                      <span className="text-xs text-gray-500">{theme.count} mentions</span>
                    </div>
                  </div>

                  {/* Segmented bar */}
                  <div className="flex rounded-full overflow-hidden h-3 bg-gray-800 mb-2">
                    {Object.entries(brandCounts)
                      .sort((a, b) => b[1] - a[1])
                      .map(([brand, count]) => (
                        <div
                          key={brand}
                          className={`${brandColors[brand] ?? 'bg-gray-500'} h-3`}
                          style={{ width: `${(count / total) * 100}%` }}
                          title={`${brand}: ${count}`}
                        />
                      ))}
                  </div>

                  {/* Brand legend */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {Object.entries(brandCounts)
                      .sort((a, b) => b[1] - a[1])
                      .map(([brand, count]) => (
                        <span key={brand} className="flex items-center gap-1 text-xs text-gray-400">
                          <span className={`w-2 h-2 rounded-full inline-block ${brandColors[brand] ?? 'bg-gray-500'}`} />
                          {brand} ({count})
                        </span>
                      ))}
                  </div>

                  {/* Insight summary */}
                  <p className="text-xs text-gray-400">{theme.consensusSummary}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Brands */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h2 className="text-lg font-semibold mb-4">Brands by Review Volume</h2>
          <div className="space-y-3">
            {brandInsights.slice(0, 6).map((brand) => (
              <div key={brand.brandName} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{brand.brandName}</p>
                  <p className="text-xs text-gray-500">{brand.topThemes.join(' · ')}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-400">{brand.reviewCount} reviews</p>
                  <p className="text-xs text-gray-400">⭐ {brand.avgRating}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key Insight Summary */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h2 className="text-lg font-semibold mb-4">Key Insights Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InsightCard
            title="Top Theme"
            body={`"${themes[0]?.theme ?? 'N/A'}" is the most discussed topic with ${themes[0]?.count ?? 0} mentions across the category.`}
            color="emerald"
          />
          <InsightCard
            title="Sentiment Signal"
            body={`${Math.round((positiveCount / totalReviews) * 100)}% positive sentiment overall. ${negativeCount} reviews flagged friction points worth investigating.`}
            color="blue"
          />
          <InsightCard
            title="Purchase Intent"
            body={`${Math.round((purchaseIntentCount / totalReviews) * 100)}% of reviewers expressed intent to repurchase — a strong commercial signal.`}
            color="violet"
          />
        </div>
      </div>
    </div>
  );
}

function KPICard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  const colors: Record<string, string> = {
    emerald: 'text-emerald-400',
    blue: 'text-blue-400',
    violet: 'text-violet-400',
    amber: 'text-amber-400',
  };
  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <p className="text-sm text-gray-400">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${colors[color]}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{sub}</p>
    </div>
  );
}

function InsightCard({ title, body, color }: { title: string; body: string; color: string }) {
  const colors: Record<string, string> = {
    emerald: 'border-emerald-500',
    blue: 'border-blue-500',
    violet: 'border-violet-500',
  };
  return (
    <div className={`border-l-4 ${colors[color]} pl-4`}>
      <p className="font-semibold text-sm">{title}</p>
      <p className="text-sm text-gray-400 mt-1">{body}</p>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Loading intelligence data...</p>
      </div>
    </div>
  );
}