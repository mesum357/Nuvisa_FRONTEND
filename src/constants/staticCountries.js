import { getCountryImagePath } from "@/utils/countryImage";

const country = (name, id, landmark) => ({
  id,
  name,
  image: getCountryImagePath(name),
  landmark,
});

export const staticCountries = [
  country("Germany", 1, "Brandenburg Gate"),
  country("Netherlands", 2, "Amsterdam Canal Houses"),
  country("Belgium", 3, "Atomium Brussels"),
  country("France", 4, "Eiffel Tower"),
  country("Italy", 5, "Colosseum Rome"),
  country("Bulgaria", 6, "Sofia Cathedral"),
  country("Estonia", 7, "Tallinn Old Town"),
  country("Hungary", 8, "Parliament Building"),
  country("Portugal", 9, "Pena Palace"),
  country("Iceland", 10, "Blue Lagoon"),
  country("Poland", 11, "Warsaw Old Town"),
  country("Norway", 12, "Norwegian Fjords"),
  country("Switzerland", 13, "Matterhorn"),
  country("Spain", 14, "Sagrada Familia"),
  country("Malta", 15, "Valletta Harbor"),
  country("Luxembourg", 16, "Grand Ducal Palace"),
  country("Greece", 17, "Parthenon"),
  country("Finland", 18, "Helsinki Cathedral"),
];
