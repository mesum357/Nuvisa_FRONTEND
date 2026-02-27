export const getCurrentWeekSlotPercentage = (date = new Date()) => {
  const dayOfMonth = date.getDate();
  const weekOfMonth = Math.ceil(dayOfMonth / 7);

  if (weekOfMonth === 1) return "96% reserved";
  if (weekOfMonth === 2) return "97% reserved";
  if (weekOfMonth === 3) return "98% reserved";
  return "99% reserved";
};
