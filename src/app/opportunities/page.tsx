'use client';

import { useEffect, useState } from 'react';
import { loadAllData } from '@/lib/data/loader';
import { extractSignals, buildBrandInsights, buildProductInsights, generateOpportunities } from '@/lib/insights/extractor';
import { Opportunity } from '@/types';

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | Opportunity['type']>('all');

  useEffect(() => {
    loadAllData().then((data) => {
      const signals = extractSignals(data);
      const brandInsights = buildBrandInsights(data, signals);
      const productInsights = buildProductInsights(data, signals);
      const opps = generateOpportunities(data, signals, brandInsights, productInsights);
      setOpportunities(opps);
      setLoading(false);
    });
  }, []);

  const filtered = filterType === 'all'
    ? opportunities
    : opportunities.filter(o => o.type === filterType);

  const typeCounts = opportunities.reduce<Record<string, number>>((acc, o) => {
    acc[o.type] = (acc[o.type] ?? 0) + 1;
    return acc;
  }, {});

  if (loading) return <LoadingScreen />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Opportunities</h1>
        <p className="text-gray-400 mt-1">
          Evidence-backed commercial opportunities surfaced from consumer intelligence
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {(['all', 'occasion', 'price', 'complaint', 'segment', 'positioning'] as const).map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`rounded-xl p-4 border text-left transition-all ${
              filterType === type
                ? 'border-emerald-500 bg-emerald-950'
                : 'border-gray-800 bg-gray-900 hover:border-gray-600'
            }`}
          >
            <p className="text-xs text-gray-400 capitalize">{type === 'all' ? 'All Types' : type}</p>
            <p className="text-2xl font-bold text-white mt-1">
              {type === 'all' ? opportunities.length : (typeCounts[type] ?? 0)}
            </p>
          </button>
        ))}
      </div>

      {/* Opportunity Cards */}
      <div className="space-y-5">
        {filtered.length === 0 && (
          <div className="bg-gray-900 rounded-xl p-8 border border-gray-800 text-center">
            <p className="text-gray-400">No opportunities found for this filter.</p>
          </div>
        )}
        {filtered.map((opp) => (
          <div key={opp.id} className="bg-gray-900 rounded-xl p-6 border border-gray-800 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{typeEmoji(opp.type)}</span>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <TypeBadge type={opp.type} />
                  </div>
                  <h3 className="font-bold text-white text-lg leading-snug">{opp.title}</h3>
                </div>
              </div>
            </div>

            {/* Explanation */}
            <p className="text-sm text-gray-300 leading-relaxed">{opp.explanation}</p>

            {/* Evidence Quotes */}
            {opp.evidence.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Supporting Evidence</p>
                <div className="space-y-2">
                  {opp.evidence.slice(0, 3).map((quote, i) => (
                    <div key={i} className="bg-gray-800 rounded-lg px-4 py-3 border-l-4 border-emerald-600">
                      <p className="text-sm text-gray-300 italic">"{quote}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Impacted Brands + Products */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {opp.impactedBrands.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2 font-medium">Impacted Brands</p>
                  <div className="flex flex-wrap gap-2">
                    {opp.impactedBrands.filter(Boolean).map(brand => (
                      <span key={brand} className="text-xs bg-violet-900 text-violet-300 px-2 py-0.5 rounded-full">
                        {brand}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {opp.impactedProducts.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2 font-medium">Impacted Products</p>
                  <div className="flex flex-wrap gap-2">
                    {opp.impactedProducts.filter(Boolean).map(product => (
                      <span key={product} className="text-xs bg-amber-900 text-amber-300 px-2 py-0.5 rounded-full">
                        {product}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function typeEmoji(type: string): string {
  const map: Record<string, string> = {
    occasion: '📅',
    price: '💰',
    complaint: '⚠️',
    segment: '👥',
    positioning: '🎯',
  };
  return map[type] ?? '💡';
}

function TypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    occasion: 'bg-violet-900 text-violet-300',
    price: 'bg-amber-900 text-amber-300',
    complaint: 'bg-red-900 text-red-300',
    segment: 'bg-blue-900 text-blue-300',
    positioning: 'bg-emerald-900 text-emerald-300',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${styles[type] ?? 'bg-gray-700 text-gray-300'}`}>
      {type}
    </span>
  );
}

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Generating opportunities...</p>
      </div>
    </div>
  );
}