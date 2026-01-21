import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ICH E2B(R3) aligned seriousness criteria
const SERIOUSNESS_CRITERIA = [
  'fatal',
  'life-threatening',
  'hospitalization',
  'disability',
  'congenital_anomaly',
  'medically_significant'
];

// System prompt for structured ICSR extraction with MedDRA coding
const SYSTEM_PROMPT = `You are an expert pharmacovigilance analyst extracting structured safety data from ICSR (Individual Case Safety Report) narratives following ICH E2B(R3) standards.

EXTRACTION REQUIREMENTS:
1. For each field, provide: value, confidence (0.0-1.0), and found (boolean)
2. Be conservative - only mark found=true if information is explicitly stated
3. Apply MedDRA coding to adverse events when identifiable

SERIOUSNESS CLASSIFICATION (ICH E2B R3 compliant):
- Fatal: Patient died
- Life-threatening: Immediate risk of death at time of event
- Hospitalization: Required or prolonged hospitalization
- Disability: Persistent/significant incapacity
- Congenital Anomaly: Birth defect in offspring
- Medically Significant: Important medical event requiring intervention
- Other Serious: Serious but not fitting above categories
- Non-serious: Not meeting seriousness criteria

MedDRA CODING:
For each adverse event, suggest a MedDRA Preferred Term (PT) that best describes the event.
If multiple events exist, code each one.

Return structured JSON with all safety-relevant data points.`;

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

    console.log("Extracting ICSR data with MedDRA coding...");

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
          { role: "user", content: `Extract structured safety data from this ICSR narrative:\n\n${narrative}` }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_icsr_data",
              description: "Extract structured ICSR data with ICH E2B(R3) alignment and MedDRA coding",
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
                      found: { type: "boolean" },
                      meddra_pt: { type: "string", nullable: true, description: "MedDRA Preferred Term" },
                      meddra_soc: { type: "string", nullable: true, description: "MedDRA System Organ Class" }
                    },
                    required: ["value", "confidence", "found"]
                  },
                  severity: {
                    type: "object",
                    properties: {
                      value: { type: "string", enum: ["Fatal", "Life-threatening", "Hospitalization", "Disability", "Congenital Anomaly", "Medically Significant", "Other serious", "Non-serious"], nullable: true },
                      confidence: { type: "number" },
                      found: { type: "boolean" }
                    },
                    required: ["value", "confidence", "found"]
                  },
                  seriousness_criteria: {
                    type: "array",
                    items: { 
                      type: "string",
                      enum: ["fatal", "life_threatening", "hospitalization", "disability", "congenital_anomaly", "medically_significant"]
                    },
                    description: "ICH E2B R3 seriousness criteria that apply"
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
                      found: { type: "boolean" },
                      qualification: { type: "string", nullable: true, description: "HCP qualification if available" }
                    },
                    required: ["value", "confidence", "found"]
                  },
                  patient_demographics: {
                    type: "object",
                    properties: {
                      value: { type: "string", nullable: true },
                      confidence: { type: "number" },
                      found: { type: "boolean" },
                      age: { type: "string", nullable: true },
                      sex: { type: "string", nullable: true },
                      weight: { type: "string", nullable: true }
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
                      found: { type: "boolean" },
                      dose: { type: "string", nullable: true },
                      frequency: { type: "string", nullable: true },
                      route: { type: "string", nullable: true }
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
                  },
                  causality_assessment: {
                    type: "object",
                    properties: {
                      value: { type: "string", nullable: true },
                      confidence: { type: "number" },
                      found: { type: "boolean" }
                    },
                    required: ["value", "confidence", "found"],
                    description: "Reporter's assessment of drug-event relationship"
                  },
                  action_taken: {
                    type: "object",
                    properties: {
                      value: { type: "string", nullable: true },
                      confidence: { type: "number" },
                      found: { type: "boolean" }
                    },
                    required: ["value", "confidence", "found"],
                    description: "Action taken with suspect drug"
                  }
                },
                required: ["suspect_drug", "adverse_event", "severity", "seriousness_criteria", "seriousness_indicators", "reporter_type", "patient_demographics", "event_onset_date", "lot_number", "dosage", "dechallenge", "rechallenge", "outcome", "concomitant_medications", "medical_history"]
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
    console.log("AI Response received");

    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error("Invalid AI response format");
    }

    const extractedData = JSON.parse(toolCall.function.arguments);
    
    // Identify missing fields with enhanced metadata
    const fieldLabels: Record<string, { label: string; priority: 'critical' | 'important' | 'optional'; description: string; inputType: 'text' | 'date' | 'select' | 'multiselect' | 'drug_search' }> = {
      suspect_drug: { label: 'Suspect Drug', priority: 'critical', description: 'Drug name, dose, route', inputType: 'drug_search' },
      adverse_event: { label: 'Adverse Event', priority: 'critical', description: 'Event term and description', inputType: 'text' },
      severity: { label: 'Severity', priority: 'critical', description: 'Seriousness classification', inputType: 'select' },
      event_onset_date: { label: 'Event Onset Date', priority: 'critical', description: 'Date when event started', inputType: 'date' },
      outcome: { label: 'Patient Outcome', priority: 'critical', description: 'Current status of patient', inputType: 'select' },
      lot_number: { label: 'Lot/Batch Number', priority: 'important', description: 'Product lot number', inputType: 'text' },
      dosage: { label: 'Dosage Information', priority: 'important', description: 'Dose, frequency, route', inputType: 'text' },
      dechallenge: { label: 'Dechallenge', priority: 'important', description: 'Outcome after stopping drug', inputType: 'select' },
      rechallenge: { label: 'Rechallenge', priority: 'important', description: 'Was drug restarted?', inputType: 'select' },
      concomitant_medications: { label: 'Concomitant Medications', priority: 'optional', description: 'Other medications taken', inputType: 'multiselect' },
      medical_history: { label: 'Medical History', priority: 'optional', description: 'Relevant medical history', inputType: 'text' }
    };

    const missingFields: string[] = [];
    const missingFieldsDetailed = [];
    
    for (const [field, meta] of Object.entries(fieldLabels)) {
      const fieldData = extractedData[field];
      const isAvailable = fieldData?.found === true && fieldData?.value;
      
      missingFieldsDetailed.push({
        field,
        label: meta.label,
        priority: meta.priority,
        description: meta.description,
        inputType: meta.inputType,
        available: isAvailable,
        meddraCode: field === 'adverse_event' ? extractedData.adverse_event?.meddra_pt : undefined
      });
      
      if (!isAvailable) {
        missingFields.push(field);
      }
    }

    // Calculate ICH E2B(R3) aligned risk score
    const seriousnessCriteria = extractedData.seriousness_criteria || [];
    const isHighRisk = seriousnessCriteria.some((c: string) => 
      ['fatal', 'life_threatening', 'hospitalization', 'disability', 'congenital_anomaly', 'medically_significant'].includes(c)
    );

    console.log("Extraction complete. Missing fields:", missingFields.length, "High Risk:", isHighRisk);

    return new Response(
      JSON.stringify({
        extractedData,
        missingFields,
        missingFieldsDetailed,
        isHighRisk,
        seriousnessCriteria
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
