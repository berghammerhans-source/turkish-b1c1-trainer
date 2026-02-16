import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Mistake {
  id: string;
  mistake_type: string;
  mistake_pattern: string;
  example_wrong: string;
  example_correct: string;
  occurrences: number;
  mastery_level: number;
  last_seen: string;
}

export function MistakeTracker() {
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMistakes();
  }, []);

  const loadMistakes = async () => {
    try {
      const { data, error } = await supabase
        .from('mistake_tracker')
        .select('*')
        .order('occurrences', { ascending: false })
        .limit(10);

      if (error) throw error;
      setMistakes(data || []);
    } catch (error) {
      console.error('Error loading mistakes:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateMastery = async (id: string, newLevel: number) => {
    try {
      await supabase
        .from('mistake_tracker')
        .update({ mastery_level: newLevel })
        .eq('id', id);
      
      loadMistakes();
    } catch (error) {
      console.error('Error updating mastery:', error);
    }
  };

  if (loading) return <div className="text-center py-8">Lade Fehler...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-lg mb-6">
        <h2 className="text-2xl font-bold mb-2">🎯 Deine Top-Fehler</h2>
        <p className="text-red-100">Fokussiere dich auf diese wiederkehrenden Muster</p>
      </div>

      {mistakes.length === 0 ? (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
          <p className="text-green-800">🎉 Noch keine Fehler getrackt! Schreibe deine erste Übung.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {mistakes.map((mistake) => (
            <div
              key={mistake.id}
              className="bg-white border-l-4 border-red-500 p-6 rounded-lg shadow-md"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="inline-block bg-red-100 text-red-800 px-3 py-1 rounded text-sm font-semibold mr-2">
                    {mistake.mistake_type}
                  </span>
                  <span className="text-red-600 font-bold">
                    {mistake.occurrences}x gemacht
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  Zuletzt: {new Date(mistake.last_seen).toLocaleDateString('de-DE')}
                </div>
              </div>

              <h3 className="font-bold text-gray-900 mb-2">{mistake.mistake_pattern}</h3>

              <div className="bg-red-50 p-3 rounded mb-2">
                <p className="text-sm text-gray-600 mb-1">❌ Falsch:</p>
                <p className="text-red-600">{mistake.example_wrong}</p>
              </div>

              <div className="bg-green-50 p-3 rounded mb-3">
                <p className="text-sm text-gray-600 mb-1">✅ Richtig:</p>
                <p className="text-green-600 font-semibold">{mistake.example_correct}</p>
              </div>

              {/* Mastery Level */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Beherrschung:</span>
                {[0, 1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    onClick={() => updateMastery(mistake.id, level)}
                    className={`w-8 h-8 rounded ${
                      mistake.mastery_level >= level
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    } hover:opacity-80`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}