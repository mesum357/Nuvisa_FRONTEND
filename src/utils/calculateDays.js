export const calculateDays = (startDate, endDate) => {
  let travelDays = 1;
  try {
    const arrival = startDate
      ? new Date(startDate)
      : null;
    const departure = endDate
      ? new Date(endDate)
      : null;
    if (arrival && departure && !isNaN(arrival) && !isNaN(departure)) {
      const diffTime = Math.abs(departure.getTime() - arrival.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24) + 1);
      travelDays = Math.max(1, diffDays);
    }
  } catch {
    travelDays = 1;
  }
  return travelDays;

}