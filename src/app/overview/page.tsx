'use client';

import { useEffect, useState } from 'react';
import { loadAllData } from '@/lib/data/loader';
import { extractSignals, summariseThemes, buildBrandInsights } from '@/lib/insights/extractor';
import { ReviewIntelligence, ThemeSummary, BrandInsight } from '@/types';

export default function OverviewPage() {
  const [reviews, setReviews] = useState<ReviewIntelligence[]>([]);
  const [themes, setThemes] = useState<ThemeSummary[]>([]);
  const [brandInsights, setBrandInsights] = useState<BrandInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData().then((data) => {
      const signals = extractSignals(data);
      setReviews(data);
      setThemes(summariseThemes(signals, data));
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
          <div className="space-y-3">
            {themes.slice(0, 6).map((theme) => (
              <div key={theme.theme}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="capitalize font-medium">{theme.theme}</span>
                  <span className="text-gray-400">{theme.count} mentions</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${theme.sentiment === 'positive' ? 'bg-emerald-500' : 'bg-red-400'}`}
                    style={{ width: `${Math.min((theme.count / (themes[0]?.count || 1)) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1 italic">"{theme.topQuote}"</p>
              </div>
            ))}
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