import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are an expert pharmacovigilance analyst generating targeted follow-up questions for ICSR (Individual Case Safety Report) cases.

CONTEXT-AWARE QUESTION GENERATION:
Based on the specific drug-event pair, generate 3-5 clinically relevant questions that are SPECIFIC to the reported adverse event.

QUESTION DESIGN PRINCIPLES:
1. Prioritize questions that help establish causality (temporal relationship, dose-response, dechallenge/rechallenge)
2. Include event-specific clinical questions (e.g., for liver injury: ask about jaundice, alcohol use, other hepatotoxic drugs)
3. Capture critical missing data elements per ICH E2B(R3)
4. Consider reporter type (HCP vs Patient) - adjust language complexity

QUESTION TYPES:
- date: For onset dates, resolution dates
- select: For outcome, dechallenge result, severity classification
- multiselect: For concomitant medications, symptoms
- text: For open-ended clinical details
- drug_search: For medication names with auto-complete

For each question, specify:
- question: The question text
- field: The data field this addresses
- type: Input type (date, select, multiselect, text, drug_search)
- options: For select/multiselect types
- required: Whether mandatory
- hint: Helper text for the reporter
- clinicalRationale: Why this question is important (for transparency)`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { drugName, adverseEvent, meddraCode, reporterType, missingFields, riskLevel } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating context-aware questions for:", drugName, adverseEvent);

    const userPrompt = `Generate targeted follow-up questions for this ICSR case:

DRUG: ${drugName || 'Unknown drug'}
ADVERSE EVENT: ${adverseEvent || 'Unknown event'}${meddraCode ? ` (MedDRA: ${meddraCode})` : ''}
REPORTER TYPE: ${reporterType === 'hcp' ? 'Healthcare Professional' : 'Patient'}
RISK LEVEL: ${riskLevel || 'Medium'}
MISSING DATA FIELDS: ${missingFields?.join(', ') || 'None specified'}

Generate 3-5 clinically relevant, event-specific questions. For example:
- If the event is "hepatotoxicity" or "liver injury", ask about jaundice, alcohol consumption, other hepatotoxic medications, ALT/AST if HCP
- If the event is "cardiac", ask about chest pain, palpitations, ECG findings if HCP
- If the event is "skin reaction", ask about rash distribution, photos if available, prior allergies

Ensure questions are appropriate for the ${reporterType === 'hcp' ? 'healthcare professional (use clinical terminology)' : 'patient (use simple, empathetic language)'}.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_followup_questions",
              description: "Generate context-aware clinical follow-up questions",
              parameters: {
                type: "object",
                properties: {
                  questions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        question: { type: "string" },
                        field: { type: "string" },
                        type: { type: "string", enum: ["date", "select", "multiselect", "text", "drug_search"] },
                        options: { type: "array", items: { type: "string" } },
                        required: { type: "boolean" },
                        hint: { type: "string" },
                        clinicalRationale: { type: "string" }
                      },
                      required: ["id", "question", "field", "type", "required"]
                    }
                  },
                  reasoning: {
                    type: "string",
                    description: "Brief explanation of why these questions were selected"
                  }
                },
                required: ["questions", "reasoning"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_followup_questions" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      throw new Error("Invalid AI response format");
    }

    const result = JSON.parse(toolCall.function.arguments);
    console.log("Generated", result.questions?.length || 0, "questions");

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Generate questions error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Question generation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
