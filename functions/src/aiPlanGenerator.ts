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
  previousPlan?: any;
  weeklyFeedback?: any;
}

export async function generateAIHairPlan(
  firestore: Firestore,
  profile: HairProfile
) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY_SECRET,
  });

  const prompt = `
You are an expert trichologist and habit-based hair coach.

Create a SIMPLE 7-day hair care plan.

User:
Hair type: ${profile.hairType}
Goals: ${profile.hairGoals.join(", ")}

Previous plan:
${JSON.stringify(profile.previousPlan ?? "none")}

Weekly feedback:
${JSON.stringify(profile.weeklyFeedback ?? "none")}

Rules:
- Never overwhelm
- If adherence was low → simplify
- If dryness → moisture
- If breakage → reduce manipulation
- Be supportive and encouraging

Return JSON ONLY:
{
  "routine": [{ "day": "Monday", "action": "...", "details": "..." }],
  "focus": "string",
  "tips": ["string"],
  "encouragement": "string"
}
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });

  let text = completion.choices[0].message?.content ?? "{}";
  text = text.replace(/```json|```/g, "").trim();
  const plan = JSON.parse(text);

  const currentRef = firestore.doc(`users/${profile.uid}/plan/current`);

  // archive previous
  const currentSnap = await currentRef.get();
  if (currentSnap.exists) {
    await firestore
      .collection(`users/${profile.uid}/plan/history`)
      .add({
        ...currentSnap.data(),
        archivedAt: new Date().toISOString(),
      });
  }

  await currentRef.set(
    {
      ...plan,
      createdAt: new Date().toISOString(),
    },
    { merge: true }
  );

  return plan;
}

