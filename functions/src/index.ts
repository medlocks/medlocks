import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { generatePlanForUser } from "./planGenerator";

admin.initializeApp();

export const generatePlan = onCall(async (request) => {
  const { data, auth } = request;

  if (!auth?.uid) {
    throw new HttpsError("unauthenticated", "You must be logged in.");
  }

  const uid = auth.uid;

  const userDoc = await admin.firestore().doc(`users/${uid}`).get();
  const profile = userDoc.exists ? { uid, ...(userDoc.data() as any) } : { uid };

  const plan = await generatePlanForUser(admin.firestore(), profile);

  return { success: true, plan };
});


