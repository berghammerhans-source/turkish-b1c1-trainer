import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Deyim {
  deyim: string;
  meaning_de: string;
  usage: string;
  example_in_context: string;
  learned_count: number;
  last_seen: string;
}

export function DeyimlerLibrary() {
  const [deyimler, setDeyimler] = useState<Deyim[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeyim, setSelectedDeyim] = useState<Deyim | null>(null);

  useEffect(() => {
    loadDeyimler();
  }, []);

  const loadDeyimler = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Lade alle Corrections mit Deyimler
      const { data: correctionsData, error: correctionsError } = await supabase
        .from('writing_corrections')
        .select(`
          suggested_deyimler,
          created_at,
          writing_exercises!inner(user_id)
        `)
        .eq('writing_exercises.user_id', user.id)
        .order('created_at', { ascending: false });

      if (correctionsError) throw correctionsError;

      // Sammle alle Deyimler und zähle Vorkommen
      const deyimMap = new Map<string, Deyim>();

      correctionsData?.forEach((correction) => {
        const deyimlerArray = correction.suggested_deyimler as Array<{
          deyim: string;
          meaning_de: string;
          usage: string;
          example_in_context: string;
        }>;

        deyimlerArray?.forEach((d) => {
          if (deyimMap.has(d.deyim)) {
            const existing = deyimMap.get(d.deyim)!;
            existing.learned_count += 1;
            // Update last_seen if this correction is newer
            if (new Date(correction.created_at) > new Date(existing.last_seen)) {
              existing.last_seen = correction.created_at;
              existing.example_in_context = d.example_in_context;
            }
          } else {
            deyimMap.set(d.deyim, {
              deyim: d.deyim,
              meaning_de: d.meaning_de,
              usage: d.usage,
              example_in_context: d.example_in_context,
              learned_count: 1,
              last_seen: correction.created_at,
            });
          }
        });
      });

      // Konvertiere Map zu Array und sortiere
      const deyimlerArray = Array.from(deyimMap.values()).sort(
        (a, b) => b.learned_count - a.learned_count
      );

      setDeyimler(deyimlerArray);
    } catch (error) {
      console.error('Error loading deyimler:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDeyimler = deyimler.filter(
    (d) =>
      d.deyim.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.meaning_de.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return <div className="text-center py-8">Lade Deyimler...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white p-6 rounded-lg mb-6">
        <h2 className="text-2xl font-bold mb-2">📚 Mein Deyimler-Wörterbuch</h2>
        <p className="text-amber-100">
          {deyimler.length} türkische Redewendungen gelernt
        </p>
      </div>

      {/* Suchfeld */}
      <div className="mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="🔍 Suche nach Deyim oder Bedeutung..."
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {filteredDeyimler.length === 0 ? (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
          <p className="text-amber-800">
            {searchTerm
              ? '🔍 Keine Deyimler gefunden. Versuche einen anderen Suchbegriff.'
              : '📝 Noch keine Deyimler gelernt! Schreibe Übungen und sammle türkische Redewendungen.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Liste der Deyimler */}
          <div className="space-y-3">
            {filteredDeyimler.map((deyim, index) => (
              <div
                key={index}
                onClick={() => setSelectedDeyim(deyim)}
                className={`bg-white p-4 rounded-lg shadow-md hover:shadow-xl transition-all cursor-pointer border-l-4 ${
                  selectedDeyim?.deyim === deyim.deyim
                    ? 'border-amber-500 ring-2 ring-amber-200'
                    : 'border-amber-300'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-amber-900 flex-1">{deyim.deyim}</h3>
                  <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs font-semibold">
                    {deyim.learned_count}x
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-1">📖 {deyim.meaning_de}</p>
                <p className="text-xs text-gray-500">
                  Zuletzt: {formatDate(deyim.last_seen)}
                </p>
              </div>
            ))}
          </div>

          {/* Detail-Ansicht */}
          <div className="lg:sticky lg:top-6 lg:h-fit">
            {selectedDeyim ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-2xl font-bold text-amber-900 mb-4">
                  {selectedDeyim.deyim}
                </h3>

                {/* Bedeutung */}
                <div className="mb-4 p-4 bg-amber-50 rounded-lg">
                  <p className="text-sm font-semibold text-gray-600 mb-1">📖 Bedeutung:</p>
                  <p className="text-gray-800">{selectedDeyim.meaning_de}</p>
                </div>

                {/* Verwendung */}
                <div className="mb-4 p-4 bg-amber-50 rounded-lg">
                  <p className="text-sm font-semibold text-gray-600 mb-1">💡 Verwendung:</p>
                  <p className="text-gray-800">{selectedDeyim.usage}</p>
                </div>

                {/* Beispiel */}
                <div className="mb-4 p-4 bg-green-50 rounded-lg">
                  <p className="text-sm font-semibold text-gray-600 mb-1">
                    ✍️ Beispiel aus deinem Text:
                  </p>
                  <p className="text-gray-800 italic">{selectedDeyim.example_in_context}</p>
                </div>

                {/* Statistiken */}
                <div className="flex gap-4 text-sm text-gray-600 pt-4 border-t border-gray-200">
                  <div>
                    <span className="font-semibold">Gelernt:</span> {selectedDeyim.learned_count}x
                  </div>
                  <div>
                    <span className="font-semibold">Zuletzt:</span>{' '}
                    {formatDate(selectedDeyim.last_seen)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                👈 Wähle ein Deyim aus um Details zu sehen
              </div>
            )}
          </div>
        </div>
      )}

      {/* Statistik Footer */}
      {deyimler.length > 0 && (
        <div className="mt-8 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex justify-around text-center">
            <div>
              <p className="text-2xl font-bold text-amber-900">{deyimler.length}</p>
              <p className="text-sm text-gray-600">Verschiedene Deyimler</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-900">
                {deyimler.reduce((sum, d) => sum + d.learned_count, 0)}
              </p>
              <p className="text-sm text-gray-600">Gesamt gelernt</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-900">
                {Math.max(...deyimler.map((d) => d.learned_count))}
              </p>
              <p className="text-sm text-gray-600">Häufigster Deyim</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}