import { auth } from "./firebase";
import { signInAnonymously } from "firebase/auth";

export interface HairProfile {
  uid?: string;
  hairType: string;
  hairGoals: string[];
  currentRoutine: { washFrequency: string; products: string[] };
  products: string[];
  previousPlan?: any;
  weeklyFeedback?: any;
}

async function ensureUser() {
  if (!auth.currentUser) {
    const { user } = await signInAnonymously(auth);
    await user.getIdToken(true);
    return user;
  }
  return auth.currentUser;
}

export async function generateHairPlan(profile: HairProfile) {
  const user = await ensureUser();
  profile.uid = user.uid;

  const res = await fetch(
    "https://us-central1-medlocks-f3fe7.cloudfunctions.net/createAIHairPlan",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile }),
    }
  );

  if (!res.ok) throw new Error("AI generation failed");
  const data = await res.json();
  return data.plan;
}
