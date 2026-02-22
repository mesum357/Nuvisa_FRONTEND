"use client";

import Image from "next/image";
import { useMemo, useState, useCallback } from "react";
import { FaUser, FaShieldAlt, FaRegCalendarAlt } from "react-icons/fa";
import { FaBuildingColumns } from "react-icons/fa6";
import { HiOutlineDeviceMobile } from "react-icons/hi";

const QtyControl = ({ value, onDecrement, onIncrement }) => (
  <div className="flex items-center gap-2">
    <button
      type="button"
      onClick={onDecrement}
      className="h-8 w-8 rounded bg-white/20 text-white text-sm font-semibold hover:bg-white/30 transition-colors"
    >
      -
    </button>
    <span className="text-sm min-w-3 text-center">{Number(value || 0)}</span>
    <button
      type="button"
      onClick={onIncrement}
      className="h-8 w-8 rounded bg-white text-black text-sm font-semibold hover:bg-gray-200 transition-colors"
    >
      +
    </button>
  </div>
);

const VisaFeeBreakdown = ({
  pricingDetails,
  priceSummary,
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
  const computedPerTravelerCurrent = Number(priceSummary?.perTravelerCurrent || 0);
  const computedPerTravelerOriginal = Number(priceSummary?.perTravelerOriginal || 0);
  const travelersCount = Number(priceSummary?.travelers || 0);

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

  const travelersOriginalTotal =
    travelersCount > 0
      ? computedPerTravelerOriginal * travelersCount
      : computedOriginalTotal;
  const travelersCurrentTotal =
    travelersCount > 0
      ? computedPerTravelerCurrent * travelersCount
      : computedVisaOnlyTotal;

  const appointmentOriginal = 100;
  const appointmentCurrent = 0;
  const conciergeOriginal = 35;
  const conciergeCurrent = 0;

  const insuranceOriginalTotal = Number(insuranceDetails?.original || 0);
  const insuranceCurrentTotal = Number(insuranceDetails?.current || 0);
  const insuranceCount = Number(insuranceDetails?.count || 0);

  const giftCardOriginalTotal = Number(giftCardDetails?.original || 0);
  const giftCardCurrentTotal = Number(giftCardDetails?.current || 0);
  const giftCardCount = Number(giftCardDetails?.count || 0);

  const subtotalAmount =
    travelersOriginalTotal +
    appointmentOriginal +
    conciergeOriginal +
    insuranceOriginalTotal +
    giftCardOriginalTotal;

  const totalAmount =
    travelersCurrentTotal +
    appointmentCurrent +
    conciergeCurrent +
    insuranceCurrentTotal +
    giftCardCurrentTotal;

  const totalSaveAmount = subtotalAmount - totalAmount;

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
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FaUser className="text-sm" />
                <span className="text-sm">Travellers</span>
              </div>
              <div className="flex items-center gap-3">
                <QtyControl
                  value={travelersCount}
                  onIncrement={onTravelersIncrement}
                  onDecrement={onTravelersDecrement}
                />
                <div className="flex items-center gap-2">
                  <span className="line-through text-white/80 text-sm">
                    {formatFeeAmount(travelersOriginalTotal)}
                  </span>
                  <span className="text-sm font-medium">
                    {formatFeeAmount(travelersCurrentTotal)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FaRegCalendarAlt className="text-sm" />
                <span className="text-sm">Appointment fee</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="line-through text-white/80 text-sm">
                  {formatFeeAmount(appointmentOriginal)}
                </span>
                <span className="text-sm font-medium">
                  {formatFeeAmount(appointmentCurrent)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
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
                <span className="line-through text-white/80 text-sm">
                  {formatFeeAmount(conciergeOriginal)}
                </span>
                <span className="text-sm font-medium">
                  {formatFeeAmount(conciergeCurrent)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FaShieldAlt className="text-sm" />
                <span className="text-sm">Travel insurance</span>
              </div>
              <div className="flex items-center gap-3">
                <QtyControl
                  value={insuranceCount}
                  onIncrement={onInsuranceIncrement}
                  onDecrement={onInsuranceDecrement}
                />
                <div className="flex items-center gap-2">
                  <span className="line-through text-white/80 text-sm">
                    {formatFeeAmount(insuranceOriginalTotal)}
                  </span>
                  <span className="text-sm font-medium">
                    {formatFeeAmount(insuranceCurrentTotal)}
                  </span>
                </div>
              </div>
            </div>
            {insuranceCount > 0 ? (
              <p className="text-xs text-gray-400 -mt-2">
                (Included for {insuranceCount} traveler{insuranceCount > 1 ? "s" : ""})
              </p>
            ) : null}

            <div className="pt-1 space-y-2">
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

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <HiOutlineDeviceMobile className="rotate-90 text-base" />
                <span className="text-sm">Digital gift card</span>
              </div>
              <div className="flex items-center gap-3">
                <QtyControl
                  value={giftCardCount}
                  onIncrement={onGiftCardIncrement}
                  onDecrement={onGiftCardDecrement}
                />
                <div className="flex items-center gap-2">
                  <span className="line-through text-white/80 text-sm">
                    {formatFeeAmount(giftCardOriginalTotal)}
                  </span>
                  <span className="text-sm font-medium">
                    {formatFeeAmount(giftCardCurrentTotal)}
                  </span>
                </div>
              </div>
            </div>
            {giftCardCount > 0 ? (
              <p className="text-xs text-gray-400 -mt-2">
                Digital gift card for {giftCardCount}
              </p>
            ) : null}

            <div className="flex justify-between text-sm pt-2 border-t border-white/15">
              <span>Subtotal</span>
              <span>{formatFeeAmount(subtotalAmount)}</span>
            </div>

            <div className="flex justify-between text-sm text-green-400">
              <span>You save</span>
              <span>{formatFeeAmount(totalSaveAmount)}</span>
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
