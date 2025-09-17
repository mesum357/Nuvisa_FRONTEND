import { useState } from "react";

const PaymentSection = () => {
  const [couponCode, setCouponCode] = useState("");
  const [isCouponApplied, setIsCouponApplied] = useState(false);

  const handleApplyCoupon = () => {
    if (couponCode.trim()) {
      setIsCouponApplied(true);
      // In a real implementation, you would validate the coupon with backend
    }
  };

  return (
    <div className="mx-auto w-full sec_bg border public_border_clr rounded-lg shadow-md p-6">
      <h2 className="text-xl font-gilroy-bold mb-6">Select a plan type</h2>

      <div className="border public_border_clr rounded-lg p-4 mb-6 sec_bg">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h3 className="font-gilroy-bold">Full payment</h3>
            <p className="text-sm text-gray-300">Pay nothing later</p>
          </div>
          <span className="text-xl font-gilroy-bold">¥17849</span>
        </div>
      </div>

      <div className="border-t public_border_clr pt-4 mb-6">
        <h3 className="font-gilroy-bold mb-4">Summary</h3>

        <div className="flex mb-4">
          <input
            type="text"
            placeholder="Apply coupon"
            className="flex-1 p-2 border public_border_clr rounded-l-md focus:ring-[#7350FF] focus:border-[#7350FF]"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
          />
          <button
            onClick={handleApplyCoupon}
            className="bg-[#7350FF] text-white px-4 py-2 rounded-r-md hover:bg-[#7350FF]"
          >
            Apply
          </button>
        </div>

        {isCouponApplied && (
          <div className="text-green-600 text-sm mb-4">
            Coupon applied successfully!
          </div>
        )}

        <div className="space-y-3 mb-4">
          <div className="flex justify-between">
            <span className="text-gray-300">Embassy fees</span>
            <span>¥15850</span>
          </div>
          <div className="text-xs text-gray-300 pl-4">
            ¥15850 (per traveller) x 1
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Teleport fee</span>
            <span>¥1999</span>
          </div>
        </div>

        <div className="border-t public_border_clr pt-4 flex justify-between font-gilroy-bold text-lg">
          <span>Grand Total</span>
          <span>¥17849</span>
        </div>
      </div>

      <button className="w-full bg-green-500 text-white py-3 px-4 rounded-md hover:bg-green-600 font-medium text-lg">
        Pay ¥17849
      </button>

      <p className="text-center mt-4 text-sm text-gray-500">
        By clicking above, you agree to our Terms of Service
      </p>
    </div>
  );
};

export default PaymentSection;
