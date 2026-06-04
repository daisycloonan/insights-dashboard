'use client';

import { useEffect, useState } from 'react';
import { loadAllData } from '@/lib/data/loader';
import { extractSignals, summariseThemes, buildBrandInsights } from '@/lib/insights/extractor';
import { ReviewIntelligence, ThemeSummary, BrandInsight } from '@/types';

interface ThemeWithSummary extends ThemeSummary {
  consensusSummary?: string;
}

export default function OverviewPage() {
  const [reviews, setReviews] = useState<ReviewIntelligence[]>([]);
  const [themes, setThemes] = useState<ThemeWithSummary[]>([]);
  const [brandInsights, setBrandInsights] = useState<BrandInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [summariesLoading, setSummariesLoading] = useState(false);

  useEffect(() => {
    loadAllData().then(async (data) => {
      const signals = extractSignals(data);
      const rawThemes = summariseThemes(signals, data);
      setReviews(data);
      setThemes(rawThemes);
      setBrandInsights(buildBrandInsights(data, signals));
      setLoading(false);

      // Now generate AI summaries for top themes
      setSummariesLoading(true);
      const topThemes = rawThemes.slice(0, 6);
      const updated = await Promise.all(
        topThemes.map(async (theme) => {
          const summary = await generateThemeSummary(theme, data);
          return { ...theme, consensusSummary: summary };
        })
      );
      setThemes(prev => {
        const rest = prev.slice(6);
        return [...updated, ...rest];
      });
      setSummariesLoading(false);
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
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-lg font-semibold">Top Consumer Themes</h2>
    {summariesLoading && (
      <span className="text-xs text-emerald-400 animate-pulse">Generating summaries...</span>
    )}
  </div>
  <div className="space-y-5">
    {themes.slice(0, 6).map((theme) => {
      // Count mentions per brand for this theme
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
      const brandColors: Record<string, string> = {
        'Double Dutch': 'bg-emerald-500',
        'Fix8': 'bg-blue-500',
        'SKIP': 'bg-violet-500',
        'UNAI': 'bg-amber-500',
      };

      return (
        <div key={theme.theme}>
          {/* Theme header */}
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

          {/* Consensus summary */}
          {theme.consensusSummary ? (
            <p className="text-xs text-gray-400">{theme.consensusSummary}</p>
          ) : (
            <p className="text-xs text-gray-600 italic animate-pulse">Summarising...</p>
          )}
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

async function generateThemeSummary(theme: ThemeSummary, reviews: ReviewIntelligence[]): Promise<string> {
  try {
    const relevantReviews = reviews
      .filter(r => r.transcript.toLowerCase().includes(theme.theme.toLowerCase()))
      .slice(0, 15)
      .map(r => `[${r.product?.productName ?? 'Unknown'} by ${r.product?.brand ?? 'Unknown'}, rating ${r.rating}/5]: ${r.transcript.slice(0, 300)}`)
      .join('\n---\n');

      console.log('Calling API for theme:', theme.theme);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `You are a senior consumer insights analyst for a beverage brand intelligence platform.

Based on the reviews below about the theme "${theme.theme}", write ONE concise insight sentence (max 30 words) that:
- Describes the overall consumer consensus on this theme
- Names specific brands or products where the signal is strongest
- Highlights any tension or nuance (e.g. loved by some, divisive for others)
- Sounds like a commercial insight, not a data summary

Reviews:
${relevantReviews}

Respond with only the insight sentence. No preamble, no quotes around the sentence.`,
        }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', response.status, errText);
      return fallbackSummary(theme, reviews);
    }

    const data = await response.json();
    console.log('API response for', theme.theme, ':', JSON.stringify(data).slice(0, 200));
    const text = data.content?.[0]?.text?.trim();
    if (!text) {
      console.error('Empty response from API:', JSON.stringify(data));
      return fallbackSummary(theme, reviews);
    }
    return text;
  } catch (err) {
    console.error('generateThemeSummary failed:', err);
    return fallbackSummary(theme, reviews);
  }
}

function fallbackSummary(theme: ThemeSummary, reviews: ReviewIntelligence[]): string {
  const relevantReviews = reviews.filter(r =>
    r.transcript.toLowerCase().includes(theme.theme.toLowerCase())
  );
  const brandCounts = relevantReviews.reduce<Record<string, number>>((acc, r) => {
    const b = r.product?.brand ?? r.brand?.brand_name ?? '';
    if (b) acc[b] = (acc[b] ?? 0) + 1;
    return acc;
  }, {});
  const topBrands = Object.entries(brandCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([b, count]) => `${b} (${count})`)
    .join(', ');
  const sentiment = theme.sentiment === 'positive' ? 'positively' : 'critically';
  const avgRating = theme.avgRating > 0 ? ` — avg rating ${theme.avgRating}/5` : '';
  return `Mentioned ${theme.count} times, most frequently for ${topBrands}. Consumers responded ${sentiment}${avgRating}.`;
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