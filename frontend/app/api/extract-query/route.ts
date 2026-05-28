import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: "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",
  baseURL: "https://integrate.api.nvidia.com/v1",
});

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    const prompt = `You are an AI assistant. Extract the plant type, location, and key features (symptoms, conditions) from the following user query.
If the plant type or location is not mentioned, use "Unknown".
Query: "${query}"

You MUST output ONLY a raw JSON object with the following structure:
{
  "plant_type": "extracted plant type or Unknown",
  "location": "extracted location or Unknown",
  "features": "extracted features and symptoms as a descriptive string"
}`;

    const completion = await openai.chat.completions.create({
      model: "meta/llama-3.1-8b-instruct",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 200,
      stream: false,
    });
    
    const responseContent = completion.choices[0]?.message?.content || "{}";
    
    let parsedData;
    try {
      const cleanedString = responseContent.replace(/```json\s*/, '').replace(/```\s*$/, '').trim();
      parsedData = JSON.parse(cleanedString);
    } catch (e) {
      parsedData = { plant_type: "Unknown", location: "Unknown", features: query };
    }

    return NextResponse.json({ status: "success", data: parsedData });
  } catch (error: any) {
    console.error("API Route Error (extract-query):", error);
    return NextResponse.json(
      { status: "error", message: error.message || "Failed to extract features" },
      { status: 500 }
    );
  }
}
