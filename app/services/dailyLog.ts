import { db, auth } from "./firebase";
import { doc, setDoc } from "firebase/firestore";

export async function logTask(action: string) {
  if (!auth.currentUser) return;

  const today = new Date().toISOString().split("T")[0];

  await setDoc(
    doc(db, `users/${auth.currentUser.uid}/dailyLogs/${today}`),
    {
      completedActions: [action],
      updatedAt: new Date(),
    },
    { merge: true }
  );
}
