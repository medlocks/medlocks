import { getFunctions, httpsCallable } from "firebase/functions";
import app from "./firebase";

const functions = getFunctions(app);

export async function generateHairPlan(profile: any) {
  const createAIHairPlan = httpsCallable(functions, "createAIHairPlan");
  const result = await createAIHairPlan({ profile });
  return result.data;
}
