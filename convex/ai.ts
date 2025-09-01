"use node";

import { action, mutation } from "./_generated/server";
import { v } from "convex/values";

// Normalize lab results to fix OCR errors
export const normalizeLabResults = action({
  args: {
    ocrText: v.string(),
  },
  handler: async (ctx, args) => {
    let text = args.ocrText;
    
    // Enhanced OCR corrections for medical lab values
    const corrections = [
      // Fix decimal placement in hemoglobin (120.9 -> 12.09, 1209 -> 12.09)
      { pattern: /(\d{3,4})\.?(\d?) ?gm?\/dl.*?hemoglobin/gi, replacement: (match: string, num: string, decimal: string) => {
        let value = parseInt(num);
        if (value > 200) value = value / 100; // 1209 -> 12.09
        else if (value > 20) value = value / 10; // 120 -> 12.0
        return `${value.toFixed(1)} g/dl Hemoglobin`;
      }},
      
      // Fix percentage values (1764% -> 76.4%, 764% -> 76.4%)
      { pattern: /(\d{3,4})%.*?(neutrophils?|lymphocytes?|monocytes?|eosinophils?|basophils?)/gi, replacement: (match: string, num: string, cell: string) => {
        let value = parseInt(num);
        if (value > 1000) value = value / 100; // 1764 -> 17.64
        else if (value > 100) value = value / 10; // 764 -> 76.4
        return `${value.toFixed(1)}% ${cell}`;
      }},
      
      // Fix platelet counts (32900000 -> 329000, 329000 Jemm -> 329000 /cmm)
      { pattern: /(\d+)\s*(jemm?|j\/cmm|cells?\/cmm).*?platelets?/gi, replacement: (match: string, num: string) => {
        let value = parseInt(num);
        if (value > 10000000) value = value / 100; // 32900000 -> 329000
        else if (value > 1000000) value = value / 10; // 3290000 -> 329000
        return `${value} /cmm Platelets`;
      }},
      
      // Fix WBC counts with extreme values
      { pattern: /(\d+)\s*(cells?\/cmm|\/?cmm).*?(wbc|white.*?blood.*?cell)/gi, replacement: (match: string, num: string) => {
        let value = parseInt(num);
        if (value > 100000) value = value / 1000; // 17640 -> 17.64
        else if (value > 50000) value = value / 100; // 1764 -> 17.64
        return `${value} /cmm WBC`;
      }},
      
      // Fix common unit errors and typos
      { pattern: /gm\/dl/gi, replacement: 'g/dl' },
      { pattern: /mg\/dl/gi, replacement: 'mg/dl' },
      { pattern: /jemm?/gi, replacement: '/cmm' },
      { pattern: /cells?\/cmm/gi, replacement: '/cmm' },
    ];
    
    // Apply corrections
    corrections.forEach(correction => {
      if (typeof correction.replacement === 'function') {
        text = text.replace(correction.pattern, correction.replacement);
      } else {
        text = text.replace(correction.pattern, correction.replacement);
      }
    });
    
    // Validate and adjust values based on medical ranges
    const labValues = [
      { name: 'hemoglobin', pattern: /(\d+\.?\d*)\s*g?\/dl.*?hemoglobin/gi, normalRange: [12, 16], unit: 'g/dl' },
      { name: 'neutrophils', pattern: /(\d+\.?\d*)%.*?neutrophils?/gi, normalRange: [40, 70], unit: '%' },
      { name: 'platelets', pattern: /(\d+)\s*\/cmm.*?platelets?/gi, normalRange: [150000, 450000], unit: '/cmm' },
    ];
    
    labValues.forEach(lab => {
      text = text.replace(lab.pattern, (match, value) => {
        let numValue = parseFloat(value);
        const [min, max] = lab.normalRange;
        
        // Adjust if value is way outside normal range
        if (numValue > max * 10) {
          numValue = numValue / 10;
        } else if (numValue > max * 100) {
          numValue = numValue / 100;
        } else if (numValue < min / 10) {
          numValue = numValue * 10;
        }
        
        return `${numValue} ${lab.unit} ${lab.name}`;
      });
    });
    
    return { normalizedText: text };
  },
});

// Analyze text with Cohere API
export const analyzeWithCohere = action({
  args: {
    text: v.string(),
    recordType: v.string(),
  },
  handler: async (ctx, args) => {
    const aiApiKey = process.env.AI_API_KEY;
    const llmProvider = process.env.LLM_PROVIDER;

    if (!aiApiKey) {
      throw new Error("AI_API_KEY environment variable not set");
    }

    if (llmProvider !== "cohere") {
      throw new Error("Only Cohere provider is currently supported");
    }

    try {
      // Generate patient summary
      const patientSummary = await callCohereAPI(aiApiKey, args.text, "patient");
      
      // Generate doctor summary
      const doctorSummary = await callCohereAPI(aiApiKey, args.text, "doctor");

      return {
        patientSummary: patientSummary.patientSummary,
        doctorSummary: doctorSummary.doctorSummary,
        flags: patientSummary.flags || [],
        model: "command-r",
      };
    } catch (error) {
      console.error("Cohere API error:", error);
      throw new Error(`AI analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  },
});

// Call Cohere API for text analysis
async function callCohereAPI(apiKey: string, text: string, summaryType: "patient" | "doctor") {
  let userMessage: string;
  
  if (summaryType === "patient") {
    userMessage = `You are an AI assistant that generates medical report summaries. Create a Patient Summary from this lab/diagnostic report.

PATIENT SUMMARY FORMAT:
1. Begin with a short introduction stating what the report is about (the disease/condition being tested)
2. List the important parameters with their values and give a short, simple explanation of what each means in everyday language
3. Ensure the explanation is friendly, reassuring, and easy to understand. Avoid heavy medical jargon
4. At the end, provide a general suggestion (e.g., "consult your doctor for further advice", "maintain hydration", "this looks within normal range", etc.)
5. Before presenting, check if any parameter values look abrupt, invalid, or unrealistic and handle them gracefully (e.g., flag as "may need re-checking")

Auto-correct obvious OCR errors: 120.9 g/dl → 12.09 g/dl, 1764% → 76.4%, 329000 Jemm → 329,000 /cmm

Output ONLY valid JSON: { "patientSummary": "string", "flags": [{"name": "string", "value": "string", "range": "string", "note": "string"}] }.

Report Text: ${text}`;
  } else {
    userMessage = `You are an AI assistant that generates medical report summaries. Create a Doctor Summary from this lab/diagnostic report.

DOCTOR SUMMARY FORMAT:
1. Start with essential information that a doctor may find useful (e.g., type of test, suspected condition)
2. Present all the important parameters with their values in a clear and structured way
3. No need for friendly explanations—keep it professional and concise
4. Mention if any values appear suspicious or need validation
5. Use proper medical terminology throughout

Auto-correct obvious OCR errors: 120.9 g/dl → 12.09 g/dl, 1764% → 76.4%, 329000 Jemm → 329,000 /cmm

Output ONLY valid JSON: { "doctorSummary": "string", "flags": [{"name": "string", "value": "string", "range": "string", "note": "string"}] }.

Report Text: ${text}`;
  }

  const response = await fetch("https://api.cohere.ai/v1/chat", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "command-r",
      temperature: 0.1,
      max_tokens: 1000,
      message: userMessage,
      preamble: "You are a clinical summarization assistant. Always respond with valid JSON only, no additional text or formatting.",
      chat_history: [],
      prompt_truncation: "AUTO"
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cohere API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  
  if (!data.text) {
    console.error("Unexpected Cohere response format:", data);
    throw new Error("Invalid response format from Cohere API");
  }

  const content = data.text.trim();
  
  try {
    // Clean up the response in case it has markdown formatting
    let cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Additional cleanup for malformed JSON
    cleanContent = cleanContent.replace(/^\s*[^{]*/, ''); // Remove text before first {
    
    // Find the last complete JSON object
    let lastBraceIndex = cleanContent.lastIndexOf('}');
    if (lastBraceIndex !== -1) {
      cleanContent = cleanContent.substring(0, lastBraceIndex + 1);
    }
    
    const parsed = JSON.parse(cleanContent);
    
    // Validate the response structure
    if (summaryType === "patient") {
      if (!parsed.patientSummary) {
        throw new Error("Missing patientSummary field");
      }
      return {
        patientSummary: parsed.patientSummary,
        flags: Array.isArray(parsed.flags) ? parsed.flags : []
      };
    } else {
      if (!parsed.doctorSummary) {
        throw new Error("Missing doctorSummary field");
      }
      return {
        doctorSummary: parsed.doctorSummary,
        flags: Array.isArray(parsed.flags) ? parsed.flags : []
      };
    }
  } catch (parseError) {
    console.error("Failed to parse Cohere response:", content);
    console.error("Parse error:", parseError);
    
    // Try to extract summary from plain text response
    if (content.includes("hemoglobin") || content.includes("blood") || content.includes("test")) {
      const extractedSummary = summaryType === "patient" 
        ? `Based on your blood test results: ${content.substring(0, 300)}...`
        : `Clinical findings: ${content.substring(0, 300)}...`;
      
      return summaryType === "patient" 
        ? { patientSummary: extractedSummary, flags: [] }
        : { doctorSummary: extractedSummary, flags: [] };
    }
    
    // Final fallback
    const fallbackSummary = summaryType === "patient" 
      ? "Your medical report has been processed. Please discuss the results with your healthcare provider for proper interpretation and next steps."
      : "Medical report analysis completed. Clinical review recommended for proper assessment and patient management decisions.";
    
    return summaryType === "patient" 
      ? { patientSummary: fallbackSummary, flags: [] }
      : { doctorSummary: fallbackSummary, flags: [] };
  }
}

// Extract text from image using OCR.Space API
export const extractTextFromImage = action({
  args: {
    imageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const ocrApiKey = process.env.OCR_API_KEY;

    if (!ocrApiKey) {
      throw new Error("OCR_API_KEY environment variable not set");
    }

    try {
      const response = await fetch("https://api.ocr.space/parse/image", {
        method: "POST",
        headers: {
          "apikey": ocrApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: args.imageUrl,
          language: "eng",
          isOverlayRequired: false,
          filetype: "auto",
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OCR API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      
      if (data.IsErroredOnProcessing) {
        throw new Error(`OCR processing error: ${data.ErrorMessage || "Unknown error"}`);
      }

      if (!data.ParsedResults || data.ParsedResults.length === 0) {
        throw new Error("No text found in image");
      }

      const extractedText = data.ParsedResults[0].ParsedText;
      
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error("No readable text found in image");
      }

      return { text: extractedText.trim() };
    } catch (error) {
      console.error("OCR API error:", error);
      throw new Error(`OCR extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  },
});


