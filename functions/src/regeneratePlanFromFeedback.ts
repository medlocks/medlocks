import { Firestore } from "firebase-admin/firestore";
import OpenAI from "openai";

export async function regeneratePlanFromFeedback(
  firestore: Firestore,
  uid: string
) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY_SECRET,
  });

  // Fetch current plan
  const planSnap = await firestore
    .doc(`users/${uid}/plan/current`)
    .get();

  if (!planSnap.exists) throw new Error("No existing plan");

  const previousPlan = planSnap.data();

  // Fetch latest feedback
  const feedbackSnap = await firestore
    .collection(`users/${uid}/weeklyFeedback`)
    .orderBy("createdAt", "desc")
    .limit(1)
    .get();

  const feedback = feedbackSnap.docs[0]?.data();

  // Fetch hair profile
  const profileSnap = await firestore.doc(`users/${uid}/profile`).get();
  const profile = profileSnap.data();

  const prompt = `
You are an expert hair coach.

The user just completed a 7-day plan.
Refine and improve the NEXT 7-day plan based on feedback.

Hair profile:
${JSON.stringify(profile)}

Previous plan:
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
    temperature: 0.7,
  });

  let text = completion.choices[0].message?.content ?? "{}";
  text = text.replace(/```json|```/g, "").trim();
  const newPlan = JSON.parse(text);

  await firestore.doc(`users/${uid}/plan/current`).set(
    {
      ...newPlan,
      updatedAt: new Date().toISOString(),
      cycleLength: 7,
    },
    { merge: true }
  );

  return newPlan;
}
