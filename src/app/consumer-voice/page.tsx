'use client';

import { useEffect, useState, useMemo } from 'react';
import { loadAllData } from '@/lib/data/loader';
import { extractSignals } from '@/lib/insights/extractor';
import { ReviewIntelligence, ExtractedSignal } from '@/types';

export default function ConsumerVoicePage() {
  const [reviews, setReviews] = useState<ReviewIntelligence[]>([]);
  const [signals, setSignals] = useState<ExtractedSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSentiment, setFilterSentiment] = useState('all');
  const [filterBrand, setFilterBrand] = useState('all');
  const [filterArchetype, setFilterArchetype] = useState('all');

  useEffect(() => {
    loadAllData().then((data) => {
      setReviews(data);
      setSignals(extractSignals(data));
      setLoading(false);
    });
  }, []);

  const brands = useMemo(() => ['all', ...Array.from(new Set(reviews.map(r => r.product?.brand ?? r.brand?.brand_name ?? 'Unknown')))], [reviews]);
  const archetypes = useMemo(() => ['all', ...Array.from(new Set(reviews.map(r => r.user?.archetype ?? 'Unknown')))], [reviews]);

  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      const brandName = r.product?.brand ?? r.brand?.brand_name ?? '';
      const archetype = r.user?.archetype ?? '';
      const matchesSearch = search === '' || r.transcript.toLowerCase().includes(search.toLowerCase());
      const matchesSentiment = filterSentiment === 'all' || r.sentiment === filterSentiment;
      const matchesBrand = filterBrand === 'all' || brandName === filterBrand;
      const matchesArchetype = filterArchetype === 'all' || archetype === filterArchetype;
      return matchesSearch && matchesSentiment && matchesBrand && matchesArchetype;
    });
  }, [reviews, search, filterSentiment, filterBrand, filterArchetype]);

  if (loading) return <LoadingScreen />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Consumer Voice</h1>
        <p className="text-gray-400 mt-1">Explore what consumers are really saying — with extracted themes and evidence</p>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          type="text"
          placeholder="Search transcripts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-gray-800 text-gray-100 rounded-lg px-4 py-2 text-sm border border-gray-700 focus:outline-none focus:border-emerald-500"
        />
        <select
          value={filterSentiment}
          onChange={(e) => setFilterSentiment(e.target.value)}
          className="bg-gray-800 text-gray-100 rounded-lg px-4 py-2 text-sm border border-gray-700 focus:outline-none focus:border-emerald-500"
        >
          <option value="all">All Sentiments</option>
          <option value="positive">Positive</option>
          <option value="neutral">Neutral</option>
          <option value="negative">Negative</option>
        </select>
        <select
          value={filterBrand}
          onChange={(e) => setFilterBrand(e.target.value)}
          className="bg-gray-800 text-gray-100 rounded-lg px-4 py-2 text-sm border border-gray-700 focus:outline-none focus:border-emerald-500"
        >
          {brands.map(b => <option key={b} value={b}>{b === 'all' ? 'All Brands' : b}</option>)}
        </select>
        <select
          value={filterArchetype}
          onChange={(e) => setFilterArchetype(e.target.value)}
          className="bg-gray-800 text-gray-100 rounded-lg px-4 py-2 text-sm border border-gray-700 focus:outline-none focus:border-emerald-500"
        >
          {archetypes.map(a => <option key={a} value={a}>{a === 'all' ? 'All Archetypes' : a}</option>)}
        </select>
      </div>

      <p className="text-sm text-gray-400">{filtered.length} reviews shown</p>

      {/* Review Cards */}
      <div className="space-y-4">
        {filtered.map((review) => {
          const reviewSignals = signals.filter(s => s.productId === review.product?.productId);
          const brandName = review.product?.brand ?? review.brand?.brand_name ?? 'Unknown';
          return (
            <div key={review.reviewId} className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <SentimentBadge sentiment={review.sentiment} />
                  <span className="text-sm font-medium text-white">{review.product?.productName ?? 'Unknown Product'}</span>
                  <span className="text-xs text-gray-500">{brandName}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <span>⭐ {review.rating}/5</span>
                  {review.purchaseIntent && <span className="text-emerald-400 text-xs font-medium">✓ Purchase Intent</span>}
                  {review.user?.archetype && <span className="text-xs bg-gray-800 px-2 py-0.5 rounded-full">{review.user.archetype}</span>}
                </div>
              </div>

              {/* Transcript */}
              <p className="text-sm text-gray-300 leading-relaxed">
                <HighlightedTranscript text={review.transcript} signals={reviewSignals} />
              </p>

              {/* Extracted Themes */}
              {reviewSignals.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {Array.from(new Set(reviewSignals.map(s => s.label))).map((label) => (
                    <ThemeTag key={label} label={label} type={reviewSignals.find(s => s.label === label)?.type ?? 'theme'} />
                  ))}
                </div>
              )}

              {/* User Tags */}
              {review.user?.tags && review.user.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1 border-t border-gray-800">
                  {review.user.tags.map((tag) => (
                    <span key={tag} className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HighlightedTranscript({ text, signals }: { text: string; signals: ExtractedSignal[] }) {
  if (signals.length === 0) return <>{text}</>;
  return <>{text}</>;
}

function SentimentBadge({ sentiment }: { sentiment: string }) {
  const styles: Record<string, string> = {
    positive: 'bg-emerald-900 text-emerald-300',
    negative: 'bg-red-900 text-red-300',
    neutral: 'bg-gray-700 text-gray-300',
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[sentiment] ?? styles.neutral}`}>
      {sentiment}
    </span>
  );
}

function ThemeTag({ label, type }: { label: string; type: string }) {
  const styles: Record<string, string> = {
    theme: 'bg-blue-900 text-blue-300',
    complaint: 'bg-red-900 text-red-300',
    driver: 'bg-emerald-900 text-emerald-300',
    occasion: 'bg-violet-900 text-violet-300',
    competitor: 'bg-amber-900 text-amber-300',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[type] ?? styles.theme}`}>
      {label}
    </span>
  );
}

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Loading consumer voice data...</p>
      </div>
    </div>
  );
}