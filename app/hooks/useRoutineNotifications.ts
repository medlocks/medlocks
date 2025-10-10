import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { auth, db } from "@/services/firebase";
import { collection, getDocs } from "firebase/firestore";

export const useRoutineNotifications = () => {
  useEffect(() => {
    const scheduleRoutines = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const routineSnap = await getDocs(collection(db, "users", user.uid, "routine"));
      routineSnap.forEach(async (doc) => {
        const item = doc.data() as { name: string; frequencyDays: number; time: string };
        const [hour, minute] = item.time.split(":").map(Number);

        await Notifications.scheduleNotificationAsync({
          content: {
            title: `Time for your ${item.name}! ✨`,
            body: `Don't forget your hair routine.`,
          },
          trigger: {
            hour,
            minute,
            repeats: true,
          },
        });
      });
    };

    scheduleRoutines();
  }, []);
};
