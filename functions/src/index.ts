import * as admin from "firebase-admin";
import * as functions from "firebase-functions/v2";
import express from "express";
import cors from "cors";
import { generateAIHairPlan, HairProfile } from "./aiPlanGenerator";
import { regeneratePlanFromFeedback } from "./regeneratePlanFromFeedback";
import { onRequest } from "firebase-functions/https";

admin.initializeApp();
const firestore = admin.firestore();

const app = express();

// ✅ Parse JSON bodies
app.use(express.json());

// ✅ CORS for localhost & deployed origin
app.use(
  cors({
    origin: ["http://localhost:8081"],
  })
);

// ✅ POST endpoint for AI hair plan
app.post("/", async (req, res) => {
  try {
    const { profile }: { profile: HairProfile } = req.body;

    if (!profile?.uid) {
      return res.status(401).json({ error: "Missing UID or unauthorized." });
    }

    const plan = await generateAIHairPlan(firestore, profile);
    return res.status(200).json({ success: true, plan });
  } catch (err: any) {
    console.error("Error generating AI hair plan:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
});

export const createAIHairPlan = functions.https.onRequest(
  {
    region: "us-central1",
    timeoutSeconds: 120,
    memory: "512MiB",
    secrets: ["OPENAI_KEY_SECRET"],
  },
  app
);

export const regenerateAIHairPlan = onRequest(async (req, res) => {
  try {
    const uid = req.body.uid;

    if (!uid) {
      res.status(400).json({ success: false, error: "Missing uid" });
      return;
    }

    const plan = await regeneratePlanFromFeedback(admin.firestore(), uid);

    res.json({ success: true, plan });
    return;
  } catch (err) {
    console.error("Regenerate plan failed:", err);
    res.status(500).json({ success: false });
    return;
  }
});


