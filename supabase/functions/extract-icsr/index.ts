import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Safety data fields that should be extracted
const REQUIRED_FIELDS = [
  'suspect_drug',
  'adverse_event', 
  'severity',
  'reporter_type',
  'patient_demographics',
  'event_onset_date',
  'lot_number',
  'dosage',
  'dechallenge',
  'rechallenge',
  'outcome',
  'concomitant_medications',
  'medical_history'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { narrative } = await req.json();
    
    if (!narrative || typeof narrative !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Narrative text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Extracting ICSR data from narrative...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an expert pharmacovigilance analyst extracting structured safety data from ICSR (Individual Case Safety Report) narratives.

Extract the following information from the narrative. For each field, provide:
- value: the extracted information (null if not found)
- confidence: a score from 0.0 to 1.0 indicating your confidence
- found: boolean indicating if this information was explicitly present

Be conservative - only mark something as found if it's clearly stated. Mark fields as not found if the information is missing or ambiguous.

Return a JSON object with these exact fields:
{
  "suspect_drug": { "value": "drug name and dose", "confidence": 0.0-1.0, "found": boolean },
  "adverse_event": { "value": "event description", "confidence": 0.0-1.0, "found": boolean },
  "severity": { "value": "Fatal|Life-threatening|Hospitalization|Disability|Other serious|Non-serious", "confidence": 0.0-1.0, "found": boolean },
  "seriousness_indicators": ["list of specific indicators"],
  "reporter_type": { "value": "hcp|patient", "confidence": 0.0-1.0, "found": boolean },
  "patient_demographics": { "value": "age, sex", "confidence": 0.0-1.0, "found": boolean },
  "event_onset_date": { "value": "date or timeframe", "confidence": 0.0-1.0, "found": boolean },
  "lot_number": { "value": "lot/batch number", "confidence": 0.0-1.0, "found": boolean },
  "dosage": { "value": "dose and route", "confidence": 0.0-1.0, "found": boolean },
  "dechallenge": { "value": "outcome after stopping", "confidence": 0.0-1.0, "found": boolean },
  "rechallenge": { "value": "outcome if restarted", "confidence": 0.0-1.0, "found": boolean },
  "outcome": { "value": "patient outcome", "confidence": 0.0-1.0, "found": boolean },
  "concomitant_medications": { "value": "other meds", "confidence": 0.0-1.0, "found": boolean },
  "medical_history": { "value": "relevant history", "confidence": 0.0-1.0, "found": boolean }
}`
          },
          {
            role: "user",
            content: `Extract structured safety data from this ICSR narrative:\n\n${narrative}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_icsr_data",
              description: "Extract structured ICSR data from narrative",
              parameters: {
                type: "object",
                properties: {
                  suspect_drug: {
                    type: "object",
                    properties: {
                      value: { type: "string", nullable: true },
                      confidence: { type: "number" },
                      found: { type: "boolean" }
                    },
                    required: ["value", "confidence", "found"]
                  },
                  adverse_event: {
                    type: "object",
                    properties: {
                      value: { type: "string", nullable: true },
                      confidence: { type: "number" },
                      found: { type: "boolean" }
                    },
                    required: ["value", "confidence", "found"]
                  },
                  severity: {
                    type: "object",
                    properties: {
                      value: { type: "string", enum: ["Fatal", "Life-threatening", "Hospitalization", "Disability", "Other serious", "Non-serious"], nullable: true },
                      confidence: { type: "number" },
                      found: { type: "boolean" }
                    },
                    required: ["value", "confidence", "found"]
                  },
                  seriousness_indicators: {
                    type: "array",
                    items: { type: "string" }
                  },
                  reporter_type: {
                    type: "object",
                    properties: {
                      value: { type: "string", enum: ["hcp", "patient"], nullable: true },
                      confidence: { type: "number" },
                      found: { type: "boolean" }
                    },
                    required: ["value", "confidence", "found"]
                  },
                  patient_demographics: {
                    type: "object",
                    properties: {
                      value: { type: "string", nullable: true },
                      confidence: { type: "number" },
                      found: { type: "boolean" }
                    },
                    required: ["value", "confidence", "found"]
                  },
                  event_onset_date: {
                    type: "object",
                    properties: {
                      value: { type: "string", nullable: true },
                      confidence: { type: "number" },
                      found: { type: "boolean" }
                    },
                    required: ["value", "confidence", "found"]
                  },
                  lot_number: {
                    type: "object",
                    properties: {
                      value: { type: "string", nullable: true },
                      confidence: { type: "number" },
                      found: { type: "boolean" }
                    },
                    required: ["value", "confidence", "found"]
                  },
                  dosage: {
                    type: "object",
                    properties: {
                      value: { type: "string", nullable: true },
                      confidence: { type: "number" },
                      found: { type: "boolean" }
                    },
                    required: ["value", "confidence", "found"]
                  },
                  dechallenge: {
                    type: "object",
                    properties: {
                      value: { type: "string", nullable: true },
                      confidence: { type: "number" },
                      found: { type: "boolean" }
                    },
                    required: ["value", "confidence", "found"]
                  },
                  rechallenge: {
                    type: "object",
                    properties: {
                      value: { type: "string", nullable: true },
                      confidence: { type: "number" },
                      found: { type: "boolean" }
                    },
                    required: ["value", "confidence", "found"]
                  },
                  outcome: {
                    type: "object",
                    properties: {
                      value: { type: "string", nullable: true },
                      confidence: { type: "number" },
                      found: { type: "boolean" }
                    },
                    required: ["value", "confidence", "found"]
                  },
                  concomitant_medications: {
                    type: "object",
                    properties: {
                      value: { type: "string", nullable: true },
                      confidence: { type: "number" },
                      found: { type: "boolean" }
                    },
                    required: ["value", "confidence", "found"]
                  },
                  medical_history: {
                    type: "object",
                    properties: {
                      value: { type: "string", nullable: true },
                      confidence: { type: "number" },
                      found: { type: "boolean" }
                    },
                    required: ["value", "confidence", "found"]
                  }
                },
                required: ["suspect_drug", "adverse_event", "severity", "seriousness_indicators", "reporter_type", "patient_demographics", "event_onset_date", "lot_number", "dosage", "dechallenge", "rechallenge", "outcome", "concomitant_medications", "medical_history"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_icsr_data" } }
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
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log("AI Response received:", JSON.stringify(aiResponse, null, 2));

    // Extract the function call arguments
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error("Invalid AI response format");
    }

    const extractedData = JSON.parse(toolCall.function.arguments);
    
    // Identify missing fields
    const missingFields: string[] = [];
    const fieldLabels: Record<string, { label: string; priority: 'critical' | 'important' | 'optional'; description: string }> = {
      suspect_drug: { label: 'Suspect Drug', priority: 'critical', description: 'Drug name, dose, route' },
      adverse_event: { label: 'Adverse Event', priority: 'critical', description: 'Event term and description' },
      severity: { label: 'Severity', priority: 'critical', description: 'Seriousness classification' },
      event_onset_date: { label: 'Event Onset Date', priority: 'critical', description: 'Date when event started' },
      outcome: { label: 'Patient Outcome', priority: 'critical', description: 'Current status of patient' },
      lot_number: { label: 'Lot/Batch Number', priority: 'important', description: 'Product lot number' },
      dosage: { label: 'Dosage Information', priority: 'important', description: 'Dose, frequency, route' },
      dechallenge: { label: 'Dechallenge', priority: 'important', description: 'Outcome after stopping drug' },
      rechallenge: { label: 'Rechallenge', priority: 'important', description: 'Was drug restarted?' },
      concomitant_medications: { label: 'Concomitant Medications', priority: 'optional', description: 'Other medications taken' },
      medical_history: { label: 'Medical History', priority: 'optional', description: 'Relevant medical history' }
    };

    const missingFieldsDetailed = [];
    for (const [field, meta] of Object.entries(fieldLabels)) {
      const fieldData = extractedData[field];
      const isAvailable = fieldData?.found === true && fieldData?.value;
      
      missingFieldsDetailed.push({
        field,
        label: meta.label,
        priority: meta.priority,
        description: meta.description,
        available: isAvailable
      });
      
      if (!isAvailable) {
        missingFields.push(field);
      }
    }

    console.log("Extraction complete. Missing fields:", missingFields);

    return new Response(
      JSON.stringify({
        extractedData,
        missingFields,
        missingFieldsDetailed
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Extract ICSR error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Extraction failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
