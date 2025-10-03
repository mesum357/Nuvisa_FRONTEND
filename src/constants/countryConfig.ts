// Country-specific visa and insurance fee configuration
export interface CountryConfig {
  visaFee: number;
  insuranceFee: number;
}

export const COUNTRY_CONFIG: Record<string, CountryConfig> = {
  // Current destinations from CompleteVisaSolutions
  BEGUN: {
    visaFee: 159,
    insuranceFee: 400,
  },
  SPAN: {
    visaFee: 159,
    insuranceFee: 450,
  },
  PONTUCA: {
    visaFee: 159,
    insuranceFee: 380,
  },
  COLAND: {
    visaFee: 159,
    insuranceFee: 420,
  },

  // Schengen Countries
  AUSTRIA: {
    visaFee: 159,
    insuranceFee: 400,
  },
  BELGIUM: {
    visaFee: 159,
    insuranceFee: 420,
  },
  BULGARIA: {
    visaFee: 159,
    insuranceFee: 380,
  },
  CROATIA: {
    visaFee: 159,
    insuranceFee: 390,
  },
  CYPRUS: {
    visaFee: 159,
    insuranceFee: 410,
  },
  "CZECH REPUBLIC": {
    visaFee: 159,
    insuranceFee: 385,
  },
  DENMARK: {
    visaFee: 159,
    insuranceFee: 460,
  },
  ESTONIA: {
    visaFee: 159,
    insuranceFee: 370,
  },
  FINLAND: {
    visaFee: 159,
    insuranceFee: 440,
  },
  FRANCE: {
    visaFee: 159,
    insuranceFee: 450,
  },
  GERMANY: {
    visaFee: 159,
    insuranceFee: 430,
  },
  GREECE: {
    visaFee: 159,
    insuranceFee: 395,
  },
  HUNGARY: {
    visaFee: 159,
    insuranceFee: 375,
  },
  ICELAND: {
    visaFee: 159,
    insuranceFee: 480,
  },
  ITALY: {
    visaFee: 159,
    insuranceFee: 425,
  },
  LATVIA: {
    visaFee: 159,
    insuranceFee: 365,
  },
  LIECHTENSTEIN: {
    visaFee: 159,
    insuranceFee: 470,
  },
  LITHUANIA: {
    visaFee: 159,
    insuranceFee: 370,
  },
  LUXEMBOURG: {
    visaFee: 159,
    insuranceFee: 450,
  },
  MALTA: {
    visaFee: 159,
    insuranceFee: 400,
  },
  NETHERLANDS: {
    visaFee: 159,
    insuranceFee: 440,
  },
  NORWAY: {
    visaFee: 159,
    insuranceFee: 490,
  },
  POLAND: {
    visaFee: 159,
    insuranceFee: 360,
  },
  PORTUGAL: {
    visaFee: 159,
    insuranceFee: 405,
  },
  ROMANIA: {
    visaFee: 159,
    insuranceFee: 355,
  },
  SLOVAKIA: {
    visaFee: 159,
    insuranceFee: 375,
  },
  SLOVENIA: {
    visaFee: 159,
    insuranceFee: 385,
  },
  SPAIN: {
    visaFee: 159,
    insuranceFee: 415,
  },
  SWEDEN: {
    visaFee: 159,
    insuranceFee: 460,
  },
  SWITZERLAND: {
    visaFee: 159,
    insuranceFee: 495,
  },

  // Additional common destinations
  "UNITED KINGDOM": {
    visaFee: 159,
    insuranceFee: 450,
  },
  UK: {
    visaFee: 159,
    insuranceFee: 450,
  },
  "UNITED STATES": {
    visaFee: 159,
    insuranceFee: 520,
  },
  USA: {
    visaFee: 159,
    insuranceFee: 520,
  },
  CANADA: {
    visaFee: 159,
    insuranceFee: 480,
  },
  AUSTRALIA: {
    visaFee: 159,
    insuranceFee: 510,
  },
  JAPAN: {
    visaFee: 159,
    insuranceFee: 400,
  },
  "SOUTH KOREA": {
    visaFee: 159,
    insuranceFee: 390,
  },
  SINGAPORE: {
    visaFee: 159,
    insuranceFee: 420,
  },
  "NEW ZEALAND": {
    visaFee: 159,
    insuranceFee: 500,
  },
};

// Default fallback configuration for unknown countries
export const DEFAULT_CONFIG: CountryConfig = {
  visaFee: 159,
  insuranceFee: 400,
};

/**
 * Get country configuration by country name
 * @param countryName - The name of the country
 * @returns CountryConfig object with visa and insurance fees
 */
export const getCountryConfig = (countryName: string): CountryConfig => {
  const normalizedCountryName = countryName.toUpperCase().trim();
  const config = COUNTRY_CONFIG[normalizedCountryName] || DEFAULT_CONFIG;

  // Debug logging to help troubleshoot

  return config;
};

// Debug function to test the configuration
export const testCountryConfig = () => {
  const testCountries = ["FRANCE", "GERMANY", "SPAIN", "NORWAY", "BEGUN"];
  testCountries.forEach(country => {
    const config = getCountryConfig(country);
  });
};
