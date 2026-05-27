import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: "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",
  baseURL: "https://integrate.api.nvidia.com/v1",
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { plant_type, location, diagnosis, weather } = body;

    const weatherString = weather
      ? `Temperature: ${weather.temperature_c}°C, Humidity: ${weather.humidity_pct}%, Rainfall: ${weather.rain_mm}mm, Soil: ${weather.soil_category}`
      : "Unknown";

    const prompt = `You are an expert plant pathologist and agronomist. 
A vision model has diagnosed a "${plant_type}" plant located in "${location}" with the following disease/condition: "${diagnosis}".
The current weather conditions are: ${weatherString}.

Please provide a detailed, practical, and highly accurate analysis.
You MUST output ONLY a raw JSON object (without Markdown code blocks, just the JSON string).
The JSON object must have exactly the following structure:
{
  "symptoms": ["Detailed symptom 1", "Detailed symptom 2", "Detailed symptom 3"],
  "treatment": ["Step 1 of treatment plan", "Step 2 of treatment plan", "Step 3 of treatment plan"],
  "ai_explanation": "A short, professional paragraph explaining why this disease occurs under these conditions and how the treatment helps."
}`;

    const completion = await openai.chat.completions.create({
      model: "meta/llama-3.1-8b-instruct",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      top_p: 0.7,
      max_tokens: 1024,
      stream: false,
    });
    
    const responseContent = completion.choices[0]?.message?.content || "{}";
    
    // Attempt to parse the JSON output
    // Sometimes Llama might wrap it in ```json ... ``` despite instructions
    let parsedData;
    try {
      const cleanedString = responseContent.replace(/```json\s*/, '').replace(/```\s*$/, '').trim();
      parsedData = JSON.parse(cleanedString);
    } catch (e) {
      console.error("Failed to parse JSON from AI response:", responseContent);
      parsedData = {
        symptoms: ["Could not generate specific symptoms."],
        treatment: ["Could not generate specific treatment plan."],
        ai_explanation: "The AI was unable to generate a structured explanation."
      };
    }

    return NextResponse.json({ status: "success", data: parsedData });
  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { status: "error", message: error.message || "Failed to generate diagnosis details" },
      { status: 500 }
    );
  }
}
