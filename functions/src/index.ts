import * as admin from "firebase-admin";
import * as functions from "firebase-functions/v2";
import express from "express";
import cors from "cors";
import { generateAIHairPlan, HairProfile } from "./aiPlanGenerator";
import { regeneratePlanFromFeedback } from "./regeneratePlanFromFeedback";

admin.initializeApp();
const firestore = admin.firestore();

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: ["http://localhost:8081"],
  })
);

// ✅ CREATE INITIAL PLAN
app.post("/", async (req, res) => {
  try {
    const { profile }: { profile: HairProfile } = req.body;

    if (!profile?.uid) {
      res.status(401).json({ error: "Missing UID" });
      return;
    }

    const plan = await generateAIHairPlan(firestore, profile);
    res.status(200).json({ success: true, plan });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
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

// ✅ REGENERATE FROM FEEDBACK
export const regenerateAIHairPlan = functions.https.onRequest(
  {
    region: "us-central1",
    timeoutSeconds: 120,
    memory: "512MiB",
    secrets: ["OPENAI_KEY_SECRET"],
  },
  async (req, res): Promise<void> => {
    try {
      const { uid } = req.body;

      if (!uid) {
        res.status(400).json({ success: false, error: "Missing uid" });
        return;
      }

      const plan = await regeneratePlanFromFeedback(firestore, uid);

      res.status(200).json({ success: true, plan });
    } catch (err) {
      console.error("Regenerate failed:", err);
      res.status(500).json({ success: false });
    }
  }
);


