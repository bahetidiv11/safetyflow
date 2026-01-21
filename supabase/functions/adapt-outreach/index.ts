import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are an expert medical writer specializing in pharmacovigilance communications. 
Your task is to adapt outreach messages for different reporter personas while maintaining regulatory compliance.

PERSONA ADAPTATION RULES:

FOR HEALTHCARE PROFESSIONALS (HCP):
- Use clinical terminology (MedDRA terms when appropriate)
- Reference regulatory requirements (ICH E2B, GVP)
- Maintain formal, professional tone
- Include specific clinical data requests
- Acknowledge their expertise and time constraints

FOR PATIENTS:
- Use simple, jargon-free language (6th grade reading level)
- Be empathetic and reassuring
- Explain why information is important for safety
- Avoid medical acronyms
- Make the process feel non-threatening
- Thank them for reporting

CHANNEL ADAPTATION:
- Email: Full formal letter format with proper salutations
- WhatsApp: Concise, friendly, with clear CTA button reference
- Portal: Professional but direct, assuming user is already authenticated

Always maintain:
- GDPR/privacy compliance language
- Clear call-to-action
- Estimated time to complete
- Contact information for questions`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { drugName, adverseEvent, reporterType, channel, caseNumber, questionCount, meddraCode } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Adapting outreach for:", reporterType, "via", channel);

    const userPrompt = `Create a personalized follow-up outreach message with these parameters:

CASE REFERENCE: ${caseNumber || 'ICSR-XXXX'}
DRUG: ${drugName || 'the medication'}${meddraCode ? ` (MedDRA: ${meddraCode})` : ''}
ADVERSE EVENT: ${adverseEvent || 'the reported event'}
REPORTER TYPE: ${reporterType === 'hcp' ? 'Healthcare Professional' : 'Patient'}
CHANNEL: ${channel || 'email'}
NUMBER OF QUESTIONS: ${questionCount || 3}

Generate:
1. Subject line (for email) or first line (for WhatsApp)
2. Main message body adapted to the reporter persona
3. Call-to-action text`;

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
              name: "generate_outreach_message",
              description: "Generate persona-adapted outreach message",
              parameters: {
                type: "object",
                properties: {
                  subject: { type: "string", description: "Email subject or WhatsApp first line" },
                  greeting: { type: "string", description: "Personalized greeting" },
                  body: { type: "string", description: "Main message content" },
                  context_box: { type: "string", description: "Why we're reaching out section" },
                  cta_text: { type: "string", description: "Call-to-action button text" },
                  closing: { type: "string", description: "Professional closing" },
                  estimated_time: { type: "string", description: "Estimated completion time" }
                },
                required: ["subject", "greeting", "body", "cta_text", "closing"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_outreach_message" } }
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
    console.log("Generated outreach message for:", reporterType);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Adapt outreach error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Message adaptation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
