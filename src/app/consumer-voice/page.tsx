'use client';

import { useEffect, useState, useMemo } from 'react';
import { loadAllData } from '@/lib/data/loader';
import { extractSignals } from '@/lib/insights/extractor';
import { ReviewIntelligence, ExtractedSignal } from '@/types';

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

function buildFilterSummary(reviews: ReviewIntelligence[]) {
  const total = reviews.length;
  if (total === 0) return null;

  const positiveCount = reviews.filter(r => r.sentiment === 'positive').length;
  const negativeCount = reviews.filter(r => r.sentiment === 'negative').length;
  const neutralCount = reviews.filter(r => r.sentiment === 'neutral').length;
  const intentCount = reviews.filter(r => r.purchaseIntent).length;

  const themeCounts = Object.entries(THEME_KEYWORDS_MAP).map(([theme, keywords]) => ({
    theme,
    count: reviews.filter(r => keywords.some(k => r.transcript.toLowerCase().includes(k))).length,
  })).filter(t => t.count > 0).sort((a, b) => b.count - a.count).slice(0, 3);

  const archetypeCounts = reviews.reduce<Record<string, number>>((acc, r) => {
    const a = r.archetype;
    if (a && a !== 'Unknown') acc[a] = (acc[a] ?? 0) + 1;
    return acc;
  }, {});
  const topArchetype = Object.entries(archetypeCounts).sort((a, b) => b[1] - a[1])[0];

  const avgRating = reviews.reduce((a, r) => a + r.rating, 0) / total;

  return {
    total,
    positiveCount,
    negativeCount,
    neutralCount,
    intentCount,
    intentPct: Math.round((intentCount / total) * 100),
    positivePct: Math.round((positiveCount / total) * 100),
    negativePct: Math.round((negativeCount / total) * 100),
    neutralPct: Math.round((neutralCount / total) * 100),
    topThemes: themeCounts,
    topArchetype: topArchetype ?? null,
    avgRating: Math.round(avgRating * 10) / 10,
  };
}

function buildReviewSummary(review: ReviewIntelligence): string {
  const text = review.transcript;
  const lower = text.toLowerCase();

  // Detect key signals
  const positiveWords = ['love', 'amazing', 'great', 'excellent', 'perfect', 'fantastic', 'recommend', 'best', 'i rate', 'really like', 'really good'];
  const negativeWords = ['hate', 'disappointed', 'terrible', 'awful', 'not for me', 'would not', "wouldn't", 'dislike'];
  const repurchaseWords = ['would buy', 'buy again', 'repurchase', 'would go back', 'buying again', 'purchase again'];
  const noRepurchaseWords = ['would not go back', "wouldn't go back", 'not sure i would', 'probably not buy', "won't buy", 'not repurchase'];
  const mixerWords = ['as a mixer', 'mix with', 'mixed with', 'cocktail', 'spirit', 'gin', 'vodka'];
  const standaloneWords = ['stand alone', 'on its own', 'by itself', 'without alcohol', 'non alcoholic'];
  const compareWords = ['compared to', 'versus', ' vs ', 'better than', 'worse than', 'prefer', 'schweppes', 'coca cola', 'pepsi'];
  const tasteWords = ['taste', 'flavour', 'flavor', 'sweet', 'bitter', 'sour', 'refreshing', 'light', 'strong', 'balanced', 'fruity', 'spicy', 'herbal'];
  const healthWords = ['healthy', 'natural', 'organic', 'probiotic', 'gut', 'functional', 'cbd', 'kombucha', 'sugar free', 'low sugar'];
  const packagingWords = ['bottle', 'can', 'packaging', 'design', 'look', 'label', 'colour', 'color'];

  const isPositive = positiveWords.some(w => lower.includes(w));
  const isNegative = negativeWords.some(w => lower.includes(w));
  const wouldRepurchase = repurchaseWords.some(w => lower.includes(w));
  const wouldNotRepurchase = noRepurchaseWords.some(w => lower.includes(w));
  const mentionsMixer = mixerWords.some(w => lower.includes(w));
  const mentionsStandalone = standaloneWords.some(w => lower.includes(w));
  const mentionsComparison = compareWords.some(w => lower.includes(w));
  const mentionsTaste = tasteWords.some(w => lower.includes(w));
  const mentionsHealth = healthWords.some(w => lower.includes(w));
  const mentionsPackaging = packagingWords.some(w => lower.includes(w));
  const isUndecided = lower.includes('not sure') || lower.includes('on the fence') || lower.includes('maybe');

  // Build natural language summary
  const parts: string[] = [];

  // Opening sentiment
  if (review.sentiment === 'negative' || isNegative) {
    parts.push('Reviewer was critical overall');
  } else if (isPositive && review.sentiment === 'positive') {
    parts.push('Reviewer gave a strong endorsement');
  } else if (isUndecided) {
    parts.push('Reviewer had a mixed reaction');
  } else {
    parts.push('Reviewer responded positively');
  }

  // Taste
  if (mentionsTaste) {
    const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 20);
    const tasteSentence = sentences.find(s => tasteWords.some(w => s.toLowerCase().includes(w)));
    if (tasteSentence) {
      // Extract key adjectives from taste sentence
      const tasteAdjs = ['light', 'strong', 'sweet', 'bitter', 'refreshing', 'spicy', 'fruity', 'herbal', 'gentle', 'bold', 'subtle', 'natural', 'artificial'];
      const foundAdjs = tasteAdjs.filter(a => tasteSentence.toLowerCase().includes(a));
      if (foundAdjs.length > 0) {
        parts.push(`enjoyed the ${foundAdjs.slice(0, 2).join(', ')} taste profile`);
      } else {
        parts.push('commented on the taste');
      }
    }
  }

  // Health / functional
  if (mentionsHealth) {
    parts.push('noted the health or functional credentials');
  }

  // Packaging
  if (mentionsPackaging && !mentionsTaste) {
    parts.push('highlighted the packaging');
  }

  // Comparison
  if (mentionsComparison) {
    parts.push('compared it to other brands or products');
  }

  // Mixer vs standalone
  if (mentionsMixer && mentionsStandalone) {
    parts.push('felt it works better as a mixer than a standalone drink');
  } else if (mentionsMixer) {
    parts.push('suggested it would work well as a mixer');
  } else if (mentionsStandalone) {
    parts.push('tried it as a standalone drink');
  }

  // Repurchase
  if (wouldNotRepurchase || (isUndecided && !wouldRepurchase)) {
    parts.push('was unsure about repurchasing');
  } else if (wouldRepurchase) {
    parts.push('expressed intent to buy again');
  }

  // Join into a natural sentence
  if (parts.length === 1) return parts[0] + '.';

  const opening = parts[0];
  const middle = parts.slice(1, -1).join(', ');
  const closing = parts[parts.length - 1];

  if (parts.length === 2) return `${opening} and ${closing}.`;
  return `${opening}, ${middle}, and ${closing}.`;
}

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
  const archetypes = useMemo(() => ['all', ...Array.from(new Set(reviews.map(r => r.archetype ?? 'Unknown')))], [reviews]);

  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      const brandName = r.product?.brand ?? r.brand?.brand_name ?? '';
      const archetype = r.archetype ?? '';
      const matchesSearch = search === '' || r.transcript.toLowerCase().includes(search.toLowerCase());
      const matchesSentiment = filterSentiment === 'all' || r.sentiment === filterSentiment;
      const matchesBrand = filterBrand === 'all' || brandName === filterBrand;
      const matchesArchetype = filterArchetype === 'all' || archetype === filterArchetype;
      return matchesSearch && matchesSentiment && matchesBrand && matchesArchetype;
    });
  }, [reviews, search, filterSentiment, filterBrand, filterArchetype]);

  const summary = useMemo(() => buildFilterSummary(filtered), [filtered]);
  const isFiltered = search !== '' || filterSentiment !== 'all' || filterBrand !== 'all' || filterArchetype !== 'all';

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

      {/* Dynamic Summary Panel */}
      {summary && (
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
              {isFiltered ? 'Filtered Selection Summary' : 'Full Dataset Summary'}
            </h2>
            <span className="text-xs text-gray-500">{summary.total} reviews</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MiniStat label="Avg Rating" value={`⭐ ${summary.avgRating}/5`} />
            <MiniStat label="Positive" value={`${summary.positivePct}%`} color="text-emerald-400" />
            <MiniStat label="Negative" value={`${summary.negativePct}%`} color="text-red-400" />
            <MiniStat label="Would Repurchase" value={`${summary.intentPct}%`} color="text-violet-400" />
          </div>

          <div className="flex rounded-full overflow-hidden h-2">
            <div className="bg-emerald-500 h-2" style={{ width: `${summary.positivePct}%` }} />
            <div className="bg-gray-500 h-2" style={{ width: `${summary.neutralPct}%` }} />
            <div className="bg-red-500 h-2" style={{ width: `${summary.negativePct}%` }} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {summary.topThemes.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Top Themes</p>
                <div className="flex flex-wrap gap-2">
                  {summary.topThemes.map(({ theme, count }) => (
                    <span key={theme} className="text-xs bg-blue-900 text-blue-300 px-2 py-1 rounded-full capitalize">
                      {theme} ({count})
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Dominant Archetype</p>
              {summary.topArchetype ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-violet-900 text-violet-300 px-2 py-1 rounded-full">
                    {summary.topArchetype[0]}
                  </span>
                  <span className="text-xs text-gray-500">
                    {summary.topArchetype[1]} of {summary.total} reviewers ({Math.round((summary.topArchetype[1] / summary.total) * 100)}%)
                  </span>
                </div>
              ) : (
                <span className="text-xs text-gray-600">No archetype data</span>
              )}
            </div>
          </div>
        </div>
      )}

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
                  {review.archetype && <span className="text-xs bg-gray-800 px-2 py-0.5 rounded-full">{review.archetype}</span>}
                </div>
              </div>

              {/* Key Takeaway */}
              <div className="bg-gray-800 rounded-lg px-4 py-2 border-l-4 border-emerald-700">
                <p className="text-xs text-emerald-400 font-semibold mb-1 uppercase tracking-wide">Key Takeaway</p>
                <p className="text-xs text-gray-300 leading-relaxed">{buildReviewSummary(review)}</p>
              </div>

              {/* Full transcript */}
              <details className="group">
                <summary className="text-xs text-gray-500 hover:text-gray-300 cursor-pointer list-none flex items-center gap-1">
                  <span className="group-open:hidden">▼ Read full transcript</span>
                  <span className="hidden group-open:inline">▲ Hide transcript</span>
                </summary>
                <p className="text-sm text-gray-400 leading-relaxed mt-2">{review.transcript}</p>
              </details>

              {/* Theme tags */}
              {reviewSignals.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {Array.from(new Set(reviewSignals.map(s => s.label))).map((label) => (
                    <ThemeTag key={label} label={label} type={reviewSignals.find(s => s.label === label)?.type ?? 'theme'} />
                  ))}
                </div>
              )}

              {/* User tags */}
              {review.user?.tags && review.user.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1 border-t border-gray-800">
                  {review.user.tags.slice(0, 4).map((tag) => (
                    <span key={tag} className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">{tag}</span>
                  ))}
                  {review.user.tags.length > 4 && (
                    <span className="text-xs text-gray-600 px-2 py-0.5">+{review.user.tags.length - 4} more</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-gray-800 rounded-lg p-3">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-sm font-bold ${color ?? 'text-white'}`}>{value}</p>
    </div>
  );
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