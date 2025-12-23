const admin = require("firebase-admin");
const fs = require("fs");

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const lessons = JSON.parse(fs.readFileSync("./lessons.json", "utf8"));

async function seed() {
  console.log("Seeding", lessons.length, "lessons...");
  const batch = db.batch();
  const col = db.collection("lessons");

  lessons.forEach((lesson) => {
    const ref = col.doc(); // auto id
    batch.set(ref, lesson);
  });

  await batch.commit();
  console.log(`✅ Seeded ${lessons.length} lessons.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
