"use client";

import { useMemo, useState, useCallback } from "react";

const VisaFeeBreakdown = ({ pricingDetails, priceSummary }) => {
  const [isOpen, setIsOpen] = useState(false);

  const feeCurrency =
    pricingDetails?.visa_fee?.currency ||
    pricingDetails?.vfs_fee?.currency ||
    pricingDetails?.service_fee?.currency ||
    priceSummary?.currency ||
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

  const computedVisaOnlyTotal = Number(priceSummary?.visaOnlyTotal || 0);
  const computedCurrentTotal = Number(priceSummary?.currentTotal || 0);
  const computedOriginalTotal = Number(priceSummary?.originalTotal || 0);
  const computedIncludedValue = Number(priceSummary?.includedValue || 0);
  const computedPerTravelerCurrent = Number(priceSummary?.perTravelerCurrent || 0);
  const computedPerTravelerOriginal = Number(priceSummary?.perTravelerOriginal || 0);
  const travelersCount = Number(priceSummary?.travelers || 0);
  const insuranceDetails = priceSummary?.recommended?.insurance || {};
  const giftCardDetails = priceSummary?.recommended?.giftCard || {};
  const expertDetails = priceSummary?.expert || {};
  const discountDetails = priceSummary?.discount || {};

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
          isOpen ? "max-h-300 opacity-100 mt-2" : "max-h-0 opacity-0"
        }`}
      >
        <div className="rounded-2xl border border-white/15 bg-[#24242D] p-4 max-sm:p-3 text-white">
          <div>
            <div className="text-sm text-white/75 max-sm:text-xs">Computed totals</div>

            <div className="mt-2 flex items-center justify-between text-sm max-sm:text-xs">
              <span className="text-white/75">Current total</span>
              <span className="font-semibold">{formatFeeAmount(computedCurrentTotal)}</span>
            </div>

            <div className="mt-2 flex items-center justify-between text-sm max-sm:text-xs">
              <span className="text-white/75">Visa-only total</span>
              <span className="font-semibold">{formatFeeAmount(computedVisaOnlyTotal)}</span>
            </div>

            <div className="mt-2 flex items-center justify-between text-sm max-sm:text-xs">
              <span className="text-white/75">Original listed total</span>
              <span className="font-semibold">{formatFeeAmount(computedOriginalTotal)}</span>
            </div>

            <div className="mt-2 flex items-center justify-between text-sm max-sm:text-xs">
              <span className="text-white/75">Bundled extras value</span>
              <span className="font-semibold">{formatFeeAmount(computedIncludedValue)}</span>
            </div>

            <div className="mt-4 border-t border-white/10 pt-4 text-sm max-sm:text-xs">
              <div className="text-white/75">Recommended selections</div>

              <div className="mt-2 flex items-center justify-between">
                <span className="text-white/70">
                  Insurance {insuranceDetails?.selected ? `(${Number(insuranceDetails?.count || 0)} travellers, ${Number(insuranceDetails?.days || 0)} days)` : "(not selected)"}
                </span>
                <span className="font-semibold">
                  {insuranceDetails?.selected
                    ? `${formatFeeAmount(Number(insuranceDetails?.current || 0))} (was ${formatFeeAmount(Number(insuranceDetails?.original || 0))})`
                    : formatFeeAmount(0)}
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <span className="text-white/70">
                  Gift card {giftCardDetails?.selected ? `(${Number(giftCardDetails?.count || 0)} qty)` : "(not selected)"}
                </span>
                <span className="font-semibold">
                  {giftCardDetails?.selected
                    ? `${formatFeeAmount(Number(giftCardDetails?.current || 0))} (was ${formatFeeAmount(Number(giftCardDetails?.original || 0))})`
                    : formatFeeAmount(0)}
                </span>
              </div>
            </div>

            <div className="mt-4 border-t border-white/10 pt-4 text-sm max-sm:text-xs">
              <div className="text-white/75">Expert add-on</div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-white/70">
                  Accountability expert {expertDetails?.selected ? "(selected)" : "(not selected)"}
                </span>
                <span className="font-semibold">
                  {expertDetails?.selected
                    ? `${formatFeeAmount(Number(expertDetails?.current || 0))} (was ${formatFeeAmount(Number(expertDetails?.original || 0))})`
                    : formatFeeAmount(0)}
                </span>
              </div>
            </div>

            <div className="mt-4 border-t border-white/10 pt-4 text-sm max-sm:text-xs">
              <div className="text-white/75">Discount code</div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-white/70">
                  {discountDetails?.applied
                    ? `${String(discountDetails?.code || "").toUpperCase()}${discountDetails?.percentage ? ` (${Number(discountDetails?.percentage)}% off)` : ""}`
                    : "No discount applied"}
                </span>
                <span className="font-semibold">
                  {discountDetails?.applied && discountDetails?.description
                    ? discountDetails.description
                    : "-"}
                </span>
              </div>
            </div>

            {travelersCount > 0 ? (
              <div className="mt-3 text-xs text-white/60 max-sm:text-[11px]">
                {travelersCount} traveller(s): {formatFeeAmount(computedPerTravelerCurrent)} current each, {formatFeeAmount(computedPerTravelerOriginal)} original each
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisaFeeBreakdown;
