"use client";

import Image from "next/image";
import { useMemo, useState, useCallback } from "react";
import { FaUser, FaShieldAlt } from "react-icons/fa";
import { FaBuildingColumns } from "react-icons/fa6";
import { HiOutlineDeviceMobile } from "react-icons/hi";

const QtyControl = ({ value, onDecrement, onIncrement }) => (
  <div className="flex items-center gap-2 max-sm:gap-1">
    <button
      type="button"
      onClick={onDecrement}
      className="h-8 w-8 rounded bg-white/20 text-white text-sm font-semibold hover:bg-white/30 transition-colors max-sm:h-7 max-sm:w-7 max-sm:text-xs"
    >
      -
    </button>
    <span className="text-sm min-w-3 text-center max-sm:text-xs">{Number(value || 0)}</span>
    <button
      type="button"
      onClick={onIncrement}
      className="h-8 w-8 rounded bg-white text-black text-sm font-semibold hover:bg-gray-200 transition-colors max-sm:h-7 max-sm:w-7 max-sm:text-xs"
    >
      +
    </button>
  </div>
);

const VisaFeeBreakdown = ({
  pricingDetails,
  priceSummary,
  travelerPricing,
  travelersCount: travelersCountProp,
  insuranceCount: insuranceCountProp,
  giftCardCount: giftCardCountProp,
  hasAdditionalTravellers,
  includeInsurance,
  includeGiftCard,
  onToggleAdditionalTravellers,
  onToggleInsurance,
  onToggleGiftCard,
  onTravelersIncrement,
  onTravelersDecrement,
  onInsuranceIncrement,
  onInsuranceDecrement,
  onGiftCardIncrement,
  onGiftCardDecrement,
}) => {
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
  const computedOriginalTotal = Number(priceSummary?.originalTotal || 0);
  const providedTravelersCurrentTotal = Number(priceSummary?.travelersCurrentTotal || 0);
  const providedTravelersOriginalTotal = Number(priceSummary?.travelersOriginalTotal || 0);
  const computedPerTravelerCurrent = Number(priceSummary?.perTravelerCurrent || 0);
  const computedPerTravelerOriginal = Number(priceSummary?.perTravelerOriginal || 0);
  const computedPerTravelerComparison = Number(priceSummary?.perTravelerComparison || 0);
  const computedPerTravelerTraditional = Number(priceSummary?.perTravelerTraditional || 0);
  const travelersCount = Number(
    travelersCountProp ?? priceSummary?.travelers ?? 0
  );
  const visaPriceDisplay = priceSummary?.visaPriceDisplay || {};
  const hasOccasionPricing = Boolean(visaPriceDisplay?.isOccasion);

  const insuranceDetails = priceSummary?.recommended?.insurance || {};
  const giftCardDetails = priceSummary?.recommended?.giftCard || {};
  const embassyDetails = priceSummary?.embassy || {};
  const embassyReference = Array.isArray(embassyDetails?.reference)
    ? embassyDetails.reference
    : [
      { amount: 78, label: "12+ yrs" },
      { amount: 40, label: "6 - 11 yrs" },
      { amount: 0, label: "0 - 5 yrs" },
    ];

  const fallbackTravelersOriginalTotal =
    travelersCount > 0
      ? computedPerTravelerOriginal * travelersCount
      : computedOriginalTotal;
  const fallbackTravelersCurrentTotal =
    travelersCount > 0
      ? computedPerTravelerCurrent * travelersCount
      : computedVisaOnlyTotal;
  const fallbackTravelersComparisonTotal =
    travelersCount > 0
      ? computedPerTravelerComparison * travelersCount
      : computedOriginalTotal;
  const fallbackTravelersTraditionalTotal =
    travelersCount > 0
      ? computedPerTravelerTraditional * travelersCount
      : 0;

  // Prefer totals from Slider summary (occasion-aware), fallback to local derivation.
  const travelersOriginalTotal =
    providedTravelersOriginalTotal > 0
      ? providedTravelersOriginalTotal
      : fallbackTravelersOriginalTotal;
  const travelersCurrentTotal =
    providedTravelersCurrentTotal > 0
      ? providedTravelersCurrentTotal
      : fallbackTravelersCurrentTotal;
  const providedTravelersComparisonTotal = Number(priceSummary?.travelersComparisonTotal || 0);
  const providedTravelersTraditionalTotal = Number(priceSummary?.travelersTraditionalTotal || 0);
  const travelersComparisonTotal =
    providedTravelersComparisonTotal > 0
      ? providedTravelersComparisonTotal
      : fallbackTravelersComparisonTotal;
  const travelersTraditionalTotal =
    providedTravelersTraditionalTotal > 0
      ? providedTravelersTraditionalTotal
      : fallbackTravelersTraditionalTotal;

  const effectiveTravelersCurrentTotal =
    Number(travelerPricing?.currentTotal) > 0
      ? Number(travelerPricing.currentTotal)
      : travelersCurrentTotal;
  const effectiveTravelersOriginalTotal =
    Number(travelerPricing?.strikeTotal) > 0
      ? Number(travelerPricing.strikeTotal)
      : travelersOriginalTotal;
  const effectiveTravelersComparisonTotal =
    Number(travelerPricing?.comparisonTotal) > 0
      ? Number(travelerPricing.comparisonTotal)
      : travelersComparisonTotal;
  const effectiveTravelersTraditionalTotal =
    Number(travelerPricing?.traditionalTotal) > 0
      ? Number(travelerPricing.traditionalTotal)
      : travelersTraditionalTotal;

  const showThreeTierOccasion =
    Boolean(travelerPricing?.hasThreeTier) ||
    (hasOccasionPricing &&
      effectiveTravelersTraditionalTotal > 0 &&
      effectiveTravelersComparisonTotal > effectiveTravelersCurrentTotal);

  const appointmentOriginal = 100;
  const appointmentCurrent = 0;
  const conciergeOriginal = 35;
  const conciergeCurrent = 0;

  const insuranceOriginalTotal = Number(insuranceDetails?.original || 0);
  const insuranceCurrentTotal = Number(insuranceDetails?.current || 0);
  const insuranceCount = Number(
    insuranceCountProp ?? insuranceDetails?.count ?? 0
  );

  const giftCardOriginalTotal = Number(giftCardDetails?.original || 0);
  const giftCardCurrentTotal = Number(giftCardDetails?.current || 0);
  const giftCardCount = Number(
    giftCardCountProp ?? giftCardDetails?.count ?? 0
  );

  const isAdditionalTravellersChecked =
    typeof hasAdditionalTravellers === "boolean"
      ? hasAdditionalTravellers
      : travelersCount > 1;
  const isInsuranceChecked =
    typeof includeInsurance === "boolean"
      ? includeInsurance
      : Boolean(insuranceDetails?.selected);
  const isGiftCardChecked =
    typeof includeGiftCard === "boolean"
      ? includeGiftCard
      : Boolean(giftCardDetails?.selected);

  const subtotalAmount =
    effectiveTravelersOriginalTotal +
    insuranceOriginalTotal +
    giftCardOriginalTotal;

  const totalAmount =
    effectiveTravelersCurrentTotal +
    insuranceCurrentTotal +
    giftCardCurrentTotal;

  const totalSaveAmount = subtotalAmount - totalAmount;

  const saveDenominator =
    subtotalAmount > 0
      ? subtotalAmount
      : effectiveTravelersComparisonTotal > 0
        ? effectiveTravelersComparisonTotal
        : 0;
  const savePercent =
    saveDenominator > 0 && Number.isFinite(totalSaveAmount)
      ? Math.min(100, Math.max(0, (totalSaveAmount / saveDenominator) * 100))
      : 0;

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="mt-2 text-md  underline  text-gray-500 font-medium max-sm:text-[11px]"
      >
        {isOpen ? "Hide details" : "View details"}
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-300 opacity-100 mt-2" : "max-h-0 opacity-0"
          }`}
      >
        <div className="rounded-2xl border border-white/15 bg-[#24242D] p-4 max-sm:px-0 max-sm:border-x-0 max-sm:rounded-none text-white">
          <div className="space-y-4 max-sm:space-y-2.5">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isAdditionalTravellersChecked}
                onChange={(event) => onToggleAdditionalTravellers?.(event.target.checked)}
                className="h-4 w-4 border-gray-300 rounded"
              />
              <span className="text-sm">Add additional travellers</span>
            </div>

            <div className="flex items-start justify-between max-sm:gap-2">
              <div className="flex items-center space-x-2 min-w-0">
                <FaUser className="text-sm" />
                <span className="text-sm">Travellers</span>
              </div>
              <div className="flex items-center justify-center items-center gap-3 max-sm:gap-2 shrink-0">
                <QtyControl
                  value={travelersCount}
                  onIncrement={onTravelersIncrement}
                  onDecrement={onTravelersDecrement}
                />
                <div className="flex gap-2 items-end gap-0.5">
                  {showThreeTierOccasion ? (
                    <>
                      <span className="line-through text-white/80 text-sm max-sm:text-xs">
                        {formatFeeAmount(effectiveTravelersTraditionalTotal)}
                      </span>
                      <span className="line-through text-red-400 text-sm max-sm:text-xs">
                        {formatFeeAmount(effectiveTravelersComparisonTotal)}
                      </span>
                    </>
                  ) : (
                    <span className="line-through text-white/80 text-sm max-sm:text-xs">
                      {formatFeeAmount(effectiveTravelersOriginalTotal)}
                    </span>
                  )}
                  <span className="text-sm font-medium max-sm:text-xs">
                    {formatFeeAmount(effectiveTravelersCurrentTotal)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between max-sm:gap-2">
              <div className="flex items-center space-x-2">
                <Image
                  src="/image/calendar.jpg"
                  alt="Calendar"
                  width={16}
                  height={16}
                  className="w-4 h-4 object-cover"
                  priority
                />
                <span className="text-sm">Appointment fee</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="line-through text-white/80 text-sm max-sm:text-xs">
                  {formatFeeAmount(appointmentOriginal)}
                </span>
                <span className="text-sm font-medium max-sm:text-xs">
                  {formatFeeAmount(appointmentCurrent)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between max-sm:gap-2">
              <div className="flex items-center space-x-2">
                <Image
                  src="/image/flights.jpg"
                  alt="Flights"
                  width={16}
                  height={16}
                  className="w-4 h-4 rounded-sm object-cover"
                  priority
                />
                <span className="text-sm">Concierge assistance</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="line-through text-white/80 text-sm max-sm:text-xs">
                  {formatFeeAmount(conciergeOriginal)}
                </span>
                <span className="text-sm font-medium max-sm:text-xs">
                  {formatFeeAmount(conciergeCurrent)}
                </span>
              </div>
            </div>

            <div className="flex items-start justify-between max-sm:gap-2">
              <div className="flex items-center space-x-2 min-w-0">
                <input
                  type="checkbox"
                  checked={isInsuranceChecked}
                  onChange={() => onToggleInsurance?.()}
                  className="h-4 w-4 border-gray-300 rounded"
                />
                <FaShieldAlt className="text-sm" />
                <span className="text-sm">Travel insurance</span>
              </div>
              <div className="flex items-center gap-3 max-sm:gap-2 shrink-0">
                <QtyControl
                  value={insuranceCount}
                  onIncrement={onInsuranceIncrement}
                  onDecrement={onInsuranceDecrement}
                />
                <div className="flex items-center gap-2">
                  <span className="line-through text-white/80 text-sm max-sm:text-xs">
                    {formatFeeAmount(insuranceOriginalTotal)}
                  </span>
                  <span className="text-sm font-medium max-sm:text-xs">
                    {formatFeeAmount(insuranceCurrentTotal)}
                  </span>
                </div>
              </div>
            </div>
            {insuranceCount > 0 ? (
              <p className="text-xs text-gray-400 -mt-1">
                (Included for {insuranceCount} traveler{insuranceCount > 1 ? "s" : ""})
              </p>
            ) : null}

            <div className="pt-0.5 space-y-1.5">
              <div className="flex items-center space-x-2">
                <FaBuildingColumns className="text-sm" />
                <span className="text-sm">Embassy fee</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Pay in person to a government official during appointment
              </p>
              <div className="space-y-1">
                {embassyReference.map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-xs max-sm:text-[11px]">
                    <span className="text-gray-400">{item.label}</span>
                    <span className="font-semibold">{formatFeeAmount(Number(item.amount || 0))}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-start justify-between max-sm:gap-2">
              <div className="flex items-center space-x-2 min-w-0">
                <input
                  type="checkbox"
                  checked={isGiftCardChecked}
                  onChange={() => onToggleGiftCard?.()}
                  className="h-4 w-4 border-gray-300 rounded"
                />
                <HiOutlineDeviceMobile className="rotate-90 text-base" />
                <span className="text-sm">Digital gift card</span>
              </div>
              <div className="flex items-center gap-3 max-sm:gap-2 shrink-0">
                <QtyControl
                  value={giftCardCount}
                  onIncrement={onGiftCardIncrement}
                  onDecrement={onGiftCardDecrement}
                />
                <div className="flex items-center gap-2">
                  <span className="line-through text-white/80 text-sm max-sm:text-xs">
                    {formatFeeAmount(giftCardOriginalTotal)}
                  </span>
                  <span className="text-sm font-medium max-sm:text-xs">
                    {formatFeeAmount(giftCardCurrentTotal)}
                  </span>
                </div>
              </div>
            </div>
            {giftCardCount > 0 ? (
              <p className="text-xs text-gray-400 -mt-1">
                Digital gift card for {giftCardCount}
              </p>
            ) : null}

            {/* <div className="flex justify-between text-sm pt-2 border-t border-white/15">
              <span>Subtotal</span>
              <span>{formatFeeAmount(subtotalAmount)}</span>
            </div> */}

            <div className="flex justify-between text-sm text-green-400">
              <span>You save</span>
              <span>{savePercent.toFixed(0)}%</span>
            </div>

            <div className="flex justify-between font-gilroy-bold text-xl pt-2 border-t border-white/15">
              <span>Total</span>
              <span>{formatFeeAmount(totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisaFeeBreakdown;
