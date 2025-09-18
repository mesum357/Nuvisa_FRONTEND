import { useState } from "react";

export const useAppointmentData = () => {
  // Static data - returns immediately without making API calls
  const [cities] = useState([
    { id: 1, name: "London" },
    { id: 2, name: "Manchester" },
    { id: 3, name: "Birmingham" },
    { id: 4, name: "Edinburgh" },
  ]);

  const [slots] = useState([
    { id: 1, time: "9:00 AM - 10:00 AM" },
    { id: 2, time: "10:00 AM - 11:00 AM" },
    { id: 3, time: "11:00 AM - 12:00 PM" },
    { id: 4, time: "12:00 PM - 1:00 PM" },
    { id: 5, time: "2:00 PM - 3:00 PM" },
    { id: 6, time: "3:00 PM - 4:00 PM" },
    { id: 7, time: "4:00 PM - 5:00 PM" },
  ]);

  // No network activity so loading flags are always false and error is null
  const loadingCities = false;
  const loadingSlots = false;
  const error = null;

  // refetchSlots is a no-op for static data
  const refetchSlots = async () => {};

  return { cities, slots, loadingCities, loadingSlots, error, refetchSlots };
};
