import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-user-id",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const { exerciseId, userText } = await req.json();

    if (!exerciseId || !userText) {
      throw new Error("exerciseId and userText required");
    }

    console.log(`Analyzing text for exercise: ${exerciseId}`);
    console.log(`Text length: ${userText.length} characters`);

    // Anthropic API Call
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicApiKey) {
      throw new Error("ANTHROPIC_API_KEY not found");
    }

    const prompt = `Du bist ein Türkisch-Lehrer für B2→C1 Lerner.

Analysiere diesen türkischen Text eines B2-Lerners (Ziel: C1-Niveau).
Interessengebiete: Business, Politik, Sport.

TEXT:
${userText}

Gib zurück als JSON:
{
  "corrections": [
    {
      "original": "originaler Satz",
      "corrected": "korrigierter Satz",
      "type": "grammar|vocabulary|word_choice|style",
      "explanation_de": "Erklärung auf Deutsch"
    }
  ],
  "variants": {
    "business_formal": "Formelle Business-Version mit Fachbegriffen",
    "colloquial_smart": "Schlagfertige Alltags-Version",
    "c1_sophisticated": "C1-Version mit mindestens 2 Deyimler (markiere sie mit **)"
  },
  "suggested_deyimler": [
    {
      "deyim": "türkisches Sprichwort",
      "meaning_de": "deutsche Bedeutung",
      "usage": "wann man es verwendet",
      "example_in_context": "Beispielsatz basierend auf dem User-Text"
    }
  ],
  "mistake_patterns": [
    {
      "pattern": "kurze Beschreibung des Fehlermusters",
      "type": "grammar|vocabulary|deyim|word_choice",
      "example_wrong": "falsches Beispiel",
      "example_correct": "richtiges Beispiel"
    }
  ]
}

WICHTIG: 
- Nur reines JSON zurückgeben, kein Markdown
- Mindestens 2 Deyimler in c1_sophisticated Variante
- Fehler kategorisieren nach Typ`;

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      console.error("Anthropic API error:", errorText);
      throw new Error(`Anthropic API error: ${anthropicResponse.status}`);
    }

    const anthropicData = await anthropicResponse.json();
    const content = anthropicData.content[0].text;
    
    // Parse JSON (entferne mögliche Markdown-Backticks)
    const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const analysis = JSON.parse(cleanContent);

    console.log(`✅ Analysis complete: ${analysis.corrections?.length || 0} corrections, ${analysis.suggested_deyimler?.length || 0} deyimler`);

    // Speichere in Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Speichere Corrections
    const { error: correctionError } = await supabase
      .from("writing_corrections")
      .insert({
        exercise_id: exerciseId,
        corrections: analysis.corrections || [],
        variant_business: analysis.variants?.business_formal || "",
        variant_colloquial: analysis.variants?.colloquial_smart || "",
        variant_c1: analysis.variants?.c1_sophisticated || "",
        suggested_deyimler: analysis.suggested_deyimler || [],
      });

    if (correctionError) {
      console.error("Error saving corrections:", correctionError);
      throw correctionError;
    }

    // 2. Update/Insert Mistake Patterns
    const userId = req.headers.get("x-user-id");
    if (userId && analysis.mistake_patterns) {
      for (const mistake of analysis.mistake_patterns) {
        // Prüfe ob Pattern schon existiert
        const { data: existing } = await supabase
          .from("mistake_tracker")
          .select("*")
          .eq("user_id", userId)
          .eq("mistake_pattern", mistake.pattern)
          .single();

        if (existing) {
          // Update: Erhöhe Occurrences
          await supabase
            .from("mistake_tracker")
            .update({
              occurrences: existing.occurrences + 1,
              last_seen: new Date().toISOString(),
              example_wrong: mistake.example_wrong,
              example_correct: mistake.example_correct,
            })
            .eq("id", existing.id);
        } else {
          // Insert: Neuer Fehler
          await supabase
            .from("mistake_tracker")
            .insert({
              user_id: userId,
              mistake_type: mistake.type,
              mistake_pattern: mistake.pattern,
              example_wrong: mistake.example_wrong,
              example_correct: mistake.example_correct,
              occurrences: 1,
              mastery_level: 0,
            });
        }
      }
    }

    return new Response(JSON.stringify(analysis), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});