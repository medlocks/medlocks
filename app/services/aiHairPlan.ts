import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY, // store your key in .env
});

const openai = new OpenAIApi(configuration);

interface HairProfile {
  hairType: string;
  hairGoals: string[];
  currentRoutine: {
    washFrequency: string;
    products: string[];
  };
  products: string[];
}

/**
 * Generates a personalized hair care plan for a user
 */
export async function generateHairPlan(profile: HairProfile) {
  try {
    const prompt = `
You are an expert hair coach. 
Create a fully personalized hair plan for a user with the following profile:

Hair type: ${profile.hairType}
Hair goals: ${profile.hairGoals.join(", ")}
Wash frequency: ${profile.currentRoutine.washFrequency}
Current products: ${profile.products.join(", ")}

Include:
- Daily / weekly routine
- Recommended products or ingredients
- Tips to reach their hair goals
- Keep it concise but actionable
Return JSON with keys: routine (array of steps), recommendedProducts (array), tips (array).
`;

    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const text = response.data.choices[0].message?.content;

    // Parse JSON safely
    try {
      return JSON.parse(text || "{}");
    } catch (err) {
      console.warn("AI returned non-JSON, returning raw text");
      return { raw: text };
    }

  } catch (error) {
    console.error("Error generating hair plan:", error);
    throw error;
  }
}
