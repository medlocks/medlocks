export function getNextStreak(
  lastDate: string | null,
  today: string,
  current: number
) {
  if (!lastDate) return 1;

  const last = new Date(lastDate);
  const now = new Date(today);

  const diff =
    (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);

  if (diff === 0) return current; // same day
  if (diff === 1) return current + 1;

  return 1; // reset
}
