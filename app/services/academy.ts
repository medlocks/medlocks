import { doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { db } from "./firebase";

export async function awardLesson(uid:string, lessonId:string, xp:number) {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  const data = userSnap.exists() ? userSnap.data() : {};
  const newXp = (data?.academy?.xp ?? 0) + xp;
  const updates:any = {
    "academy.xp": newXp,
    "academy.completedLessons": arrayUnion(lessonId)
  };
  // example badge rule
  if (newXp >= 50 && !(data?.academy?.badges || []).includes("Hair Scholar")) {
    updates["academy.badges"] = arrayUnion("Hair Scholar");
  }
  await updateDoc(userRef, updates);
  return { xp: newXp };
}
