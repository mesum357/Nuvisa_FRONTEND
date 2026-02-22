"use client";

import { useMemo, useState, useCallback } from "react";

const VisaFeeBreakdown = ({ pricingDetails }) => {
  const [isOpen, setIsOpen] = useState(false);

  const feeCurrency =
    pricingDetails?.visa_fee?.currency ||
    pricingDetails?.vfs_fee?.currency ||
    pricingDetails?.service_fee?.currency ||
    "INR";

  const currencySymbol = useMemo(() => {
    if (feeCurrency === "INR") return "₹";
    if (feeCurrency === "GBP") return "£";
    if (feeCurrency === "EUR") return "€";
    if (feeCurrency === "USD") return "$";
    return "";
  }, [feeCurrency]);

  const formatFeeAmount = useCallback(
    (amount) => {
      const numericAmount = Number(amount || 0);
      if (!Number.isFinite(numericAmount)) return `${currencySymbol}0`;
      return `${currencySymbol}${numericAmount.toLocaleString("en-IN")}`;
    },
    [currencySymbol]
  );

  const teleportFee = Number(pricingDetails?.service_fee?.amount || 0);
  const appointmentFee = Number(pricingDetails?.vfs_fee?.amount || 0);

  const embassyFeeEntries = useMemo(() => {
    const visaFee = pricingDetails?.visa_fee;
    if (!visaFee || typeof visaFee !== "object") return [];

    if (Array.isArray(visaFee.breakdown) && visaFee.breakdown.length > 0) {
      return visaFee.breakdown
        .map((entry) => ({
          label: entry?.label || entry?.name || "",
          amount: Number(entry?.amount || 0),
        }))
        .filter((entry) => Number.isFinite(entry.amount));
    }

    const ageKeyMap = [
      ["age_0_5", "(0 - 5 yrs)"],
      ["child_0_5", "(0 - 5 yrs)"],
      ["age_6_12", "(6 - 12 yrs)"],
      ["child_6_12", "(6 - 12 yrs)"],
      ["age_13_plus", "(13+ yrs)"],
      ["adult", "(13+ yrs)"],
    ];

    const ageEntries = ageKeyMap
      .filter(([key]) => visaFee[key] !== undefined && visaFee[key] !== null)
      .map(([key, label]) => ({ label, amount: Number(visaFee[key]) }))
      .filter((entry) => Number.isFinite(entry.amount));

    if (ageEntries.length > 0) {
      return ageEntries;
    }

    if (visaFee.amount !== undefined && visaFee.amount !== null) {
      return [{ label: "", amount: Number(visaFee.amount) }].filter((entry) =>
        Number.isFinite(entry.amount)
      );
    }

    return [];
  }, [pricingDetails]);

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="mt-2 text-sm text-blue-300 underline"
      >
        {isOpen ? "Hide details" : "View details"}
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-96 opacity-100 mt-2" : "max-h-0 opacity-0"
        }`}
      >
        <div className="rounded-2xl border border-white/15 bg-[#24242D] p-4 max-sm:p-3 text-white">
          <div className="flex items-center justify-between text-sm max-sm:text-xs">
            <span className="text-white/75">Teleport fees</span>
            <span className="font-semibold">{formatFeeAmount(teleportFee)}</span>
          </div>

          <div className="mt-3 flex items-start justify-between gap-2 text-sm max-sm:text-xs">
            <div>
              <div className="text-white/75">Appointment fee</div>
              <div className="text-white/50">Pay online</div>
            </div>
            <span className="font-semibold">{formatFeeAmount(appointmentFee)}</span>
          </div>

          <div className="mt-4 flex items-start justify-between gap-2">
            <div className="text-sm max-sm:text-xs">
              <div className="text-white/75">Embassy fees</div>
              <div className="text-white/50">Pay at embassy during appointment</div>
            </div>

            <div className="text-right">
              {embassyFeeEntries.length > 0 ? (
                embassyFeeEntries.map((entry, index) => (
                  <div key={`${entry.label || "embassy"}-${index}`} className={index > 0 ? "mt-2" : ""}>
                    <div className="text-sm font-semibold max-sm:text-xs">
                      {formatFeeAmount(entry.amount)}
                    </div>
                    {entry.label ? (
                      <div className="text-xs text-white/65">{entry.label}</div>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="text-sm font-semibold max-sm:text-xs">{formatFeeAmount(0)}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisaFeeBreakdown;
