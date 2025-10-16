import fs from "fs";
import path from "path";
import { Firestore } from "firebase-admin/firestore";

type Profile = {
  uid: string;
  hairType?: string;
  hairGoals?: string[];
  products?: string[];
};

function loadKnowledge() {
  const file = path.join(__dirname, "data", "hair_expert_data.json");
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function pickTemplate(profile: Profile, knowledge: any) {
  if ((profile.hairGoals || []).includes("growth")) return knowledge.templates["default_growth"];
  return knowledge.templates["default_growth"];
}

function expandIntervention(id: string, knowledge: any) {
  return knowledge.interventions[id] || { id, name: id, instructions: "" };
}

export async function generatePlanForUser(firestore: Firestore, profile: Profile) {
  const knowledge = loadKnowledge();
  const template = pickTemplate(profile, knowledge);
  const weeks = template.weeks.map((w: any, idx: number) => ({
    week: w.week ?? idx + 1,
    focus: w.focus,
    actions: (w.actions || []).map((aId: string) => {
      const inter = expandIntervention(aId, knowledge);
      return {
        id: inter.id,
        name: inter.name,
        instructions: inter.instructions,
        time: inter.defaultTime || "19:00",
        active: true,
      };
    }),
  }));

  const productHints = new Set<string>();
  const rulesForType = knowledge.rules[profile.hairType || ""];
  if (rulesForType?.recommendedIngredients) rulesForType.recommendedIngredients.forEach((p: string) => productHints.add(p));
  (profile.hairGoals || []).forEach((g) => {
    (knowledge.goalProfiles[g]?.actions || []).forEach((act: string) => productHints.add(act));
  });

  const plan = {
    generatedAt: new Date().toISOString(),
    template: template.title,
    weeks,
    productHints: Array.from(productHints),
    notes: template.notes || ""
  };

  await firestore.doc(`users/${profile.uid}/plan/current`).set(plan, { merge: true });
  await firestore.doc(`users/${profile.uid}`).set({ latestPlanGeneratedAt: new Date() }, { merge: true });
  return plan;
}
