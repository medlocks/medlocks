import { Firestore } from "firebase-admin/firestore";
import OpenAI from "openai";

export async function regeneratePlanFromFeedback(
  firestore: Firestore,
  uid: string
) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY_SECRET!,
  });

  // ✅ Fetch current plan
  const planRef = firestore.doc(`users/${uid}/plan/current`);
  const planSnap = await planRef.get();

  if (!planSnap.exists) {
    throw new Error("No existing plan found");
  }

  const previousPlan = planSnap.data();

  // ✅ Fetch latest feedback
  const feedbackSnap = await firestore
    .collection(`users/${uid}/weeklyFeedback`)
    .orderBy("createdAt", "desc")
    .limit(1)
    .get();

  if (feedbackSnap.empty) {
    throw new Error("No feedback found");
  }

  const feedback = feedbackSnap.docs[0].data();

  // ✅ FIXED: Fetch profile from CORRECT location
  const profileSnap = await firestore.doc(`users/${uid}`).get();

  if (!profileSnap.exists) {
    throw new Error("User profile not found");
  }

  const profile = profileSnap.data();

  const prompt = `
You are an expert hair coach.

The user has completed a 7-day hair routine.
You MUST generate a NEW 7-day plan.

Rules:
- Do NOT reuse the same routine structure.
- Adjust frequency, focus, or difficulty based on feedback.
- If hair feels worse → simplify & increase moisture.
- If better → progress slightly.
- If same → change strategy.

Hair profile:
${JSON.stringify(profile)}

Previous plan (DO NOT COPY):
${JSON.stringify(previousPlan)}

Weekly feedback:
${JSON.stringify(feedback)}

Return JSON ONLY with:
- routine: array of { day, action, details }
- tips: array of strings
- recommendedProducts: array of strings
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.8,
  });

  let text = completion.choices[0].message?.content ?? "{}";
  text = text.replace(/```json|```/g, "").trim();

  const newPlan = JSON.parse(text);

  await planRef.set({
    ...newPlan,
    updatedAt: new Date().toISOString(),
    cycleLength: 7,
    regeneratedFromFeedback: true,
  });

  return newPlan;
}

