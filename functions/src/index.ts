import * as admin from "firebase-admin";
import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import { generateAIHairPlan, HairProfile } from "./aiPlanGenerator";


admin.initializeApp();
const firestore = admin.firestore();

export const createAIHairPlan = onCall(
  {
    region: "us-central1",
    secrets: ["OPENAI_API_KEY"], 
    timeoutSeconds: 120,
    memory: "512MiB",
  },
  async (request: CallableRequest<{ profile: HairProfile }>) => {
    const { auth, data } = request;

    if (!auth?.uid) {
      throw new HttpsError("unauthenticated", "You must be logged in.");
    }

    const profile: HairProfile = { ...data.profile, uid: auth.uid };

    try {
      const plan = await generateAIHairPlan(firestore, profile);
      return { success: true, plan };
    } catch (err: any) {
      console.error("Error generating AI hair plan:", err);
      throw new HttpsError("internal", "Failed to generate AI hair plan.");
    }
  }
);

