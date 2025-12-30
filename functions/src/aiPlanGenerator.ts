import { Firestore } from "firebase-admin/firestore";
import OpenAI from "openai";
import { HairProfile } from "../../app/types/HairProfile";

export async function generateAIHairPlan(
  firestore: Firestore,
  profile: HairProfile
) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY_SECRET!,
  });

  const age =
    profile.dateOfBirth
      ? Math.floor(
          (Date.now() -
            new Date(profile.dateOfBirth).getTime()) /
            (1000 * 60 * 60 * 24 * 365.25)
        )
      : "unknown";

  const prompt = `
You are an expert trichologist and habit-based hair coach.

Create a SIMPLE 7-day hair care plan.

User:
Age: ${age}
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
- Age > 35 → prioritize scalp health & density
- Age < 25 → focus on prevention & consistency
- Be encouraging and supportive

Return JSON ONLY:
{
  "routine": [
    { "day": "Monday", "action": "...", "details": "...", "time": "08:00" }
  ],
  "focus": "string",
  "tips": ["string"],
  "encouragement": "string"
}
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.6,
  });

  let text = completion.choices[0].message?.content ?? "{}";
  text = text.replace(/```json|```/g, "").trim();

  let plan;
  try {
    plan = JSON.parse(text);
  } catch {
    throw new Error("AI returned invalid JSON");
  }

  const currentRef = firestore.doc(`users/${profile.uid}/plan/current`);
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

