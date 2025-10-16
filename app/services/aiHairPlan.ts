import { auth } from "./firebase";
import { signInAnonymously } from "firebase/auth";

export interface HairProfile {
  uid?: string;
  hairType: string;
  hairGoals: string[];
  currentRoutine: { washFrequency: string; products: string[] };
  products: string[];
  updatedAt?: Date;
}

async function ensureUserLoggedIn() {
  if (!auth.currentUser) {
    console.log("👤 No user, signing in anonymously...");
    const { user } = await signInAnonymously(auth);
    await user.getIdToken(true); // refresh token
    return user;
  }

  console.log("Using existing user:", auth.currentUser.uid);
  return auth.currentUser;
}

export async function generateHairPlan(profile: HairProfile) {
  try {
    const user = await ensureUserLoggedIn();
    profile.uid = user.uid; // required by backend

    console.log("Sending AI request payload:", profile);

    const response = await fetch(
      "https://us-central1-medlocks-f3fe7.cloudfunctions.net/createAIHairPlan",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Request failed: ${response.status} - ${text}`);
    }

    const data = await response.json();
    if (!data.success || !data.plan) {
      throw new Error("Invalid response from AI backend.");
    }

    return data.plan;
  } catch (error: any) {
    console.error("AI generation failed:", error);
    throw new Error(`AI generation failed: ${error.message || "Unknown error"}`);
  }
}


