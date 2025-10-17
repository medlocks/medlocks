import { Firestore } from "firebase-admin/firestore";
import OpenAI from "openai";

export interface HairProfile {
  uid: string;
  hairType: string;
  hairGoals: string[];
  currentRoutine: {
    washFrequency: string;
    products: string[];
  };
  products: string[];
}

export async function generateAIHairPlan(firestore: Firestore, profile: HairProfile) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY_SECRET, // Your environment variable
  });

  // Prompt for AI
  const prompt = `
You are an expert trichologist/hair care coach.
Create a personalized 4-week hair care routine for this user.
When building a routine ignore any existing products they have if they are counter productive.
Give specific hair product recommendations with specific ingredients like what to look for and avoid etc (can be brand specific in the product recommendations) - but keep them broader (not brand specific) in the routine array.

Hair type: ${profile.hairType}
Hair goals: ${profile.hairGoals.join(", ")}
Wash frequency: ${profile.currentRoutine.washFrequency}
Current products: ${profile.products.join(", ")}

Return JSON ONLY with keys:
- routine: array of { week: number, day: string, action: string, details: string }
- recommendedProducts: array of strings
- tips: array of strings
No additional text, no markdown, no comments.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    let text = completion.choices[0].message?.content ?? "{}";

    // Remove backticks or markdown artifacts
    text = text.replace(/```json|```/g, "").trim();

    const plan = JSON.parse(text);

    // Save plan in Firestore
    await firestore.doc(`users/${profile.uid}/plan/current`).set(
      {
        ...plan,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return plan;
  } catch (err) {
    console.error("Error generating AI hair plan:", err);
    return { raw: err instanceof Error ? err.message : String(err) };
  }
}

