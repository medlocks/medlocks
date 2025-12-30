import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/services/firebase";
import { getNextStreak } from "@/utils/streaks";

export async function updateStreakForDay(
  uid: string,
  dateKey: string
) {
  const ref = doc(db, "users", uid, "stats", "streak");
  const snap = await getDoc(ref);

  let current = 0;
  let longest = 0;
  let lastDate: string | null = null;

  if (snap.exists()) {
    const d = snap.data();
    current = d.currentStreak || 0;
    longest = d.longestStreak || 0;
    lastDate = d.lastCompletedDate || null;
  }

  const next = getNextStreak(lastDate, dateKey, current);

  await setDoc(
    ref,
    {
      currentStreak: next,
      longestStreak: Math.max(longest, next),
      lastCompletedDate: dateKey,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return next;
}
