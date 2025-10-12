import OpenAI from "openai";
import { Firestore } from "firebase-admin/firestore";

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
  const OpenAI = (await import("openai")).default;
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, 
  });

  const prompt = `
You are an expert hair coach.
Create a fully personalized 4-week hair care plan.

Hair type: ${profile.hairType}
Hair goals: ${profile.hairGoals.join(", ")}
Wash frequency: ${profile.currentRoutine.washFrequency}
Current products: ${profile.products.join(", ")}

Return valid JSON with keys:
routine (array), recommendedProducts (array), tips (array).
  `;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });

  const text = completion.choices[0].message?.content ?? "{}";

  try {
    const plan = JSON.parse(text);
    await firestore.doc(`users/${profile.uid}/plan/current`).set(plan, { merge: true });
    return plan;
  } catch (err) {
    console.error("AI response invalid JSON:", err);
    return { raw: text };
  }
}
