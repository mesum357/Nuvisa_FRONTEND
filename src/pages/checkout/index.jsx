import { useState } from "react";
import {
  Mail,
  User,
  Shield,
  CreditCard,
  ChevronDown,
  Edit,
  Check,
} from "lucide-react";
import { useAppSelector } from "@/store";

const index = () => {
  const visaState = useAppSelector((state) => state.visa);

  const [email, setEmail] = useState("name@example.com");
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [tempEmail, setTempEmail] = useState(email);
  const [newsletter, setNewsletter] = useState(true);
  const [travelers, setTravelers] = useState(visaState.travelers || 1);
  const [insurance, setInsurance] = useState(true);
  const [evisa, setEvisa] = useState(true);

  const handleTravelerChange = (increment) => {
    const newValue = travelers + increment;
    if (newValue >= 1) {
      setTravelers(newValue);
    }
  };

  const handleEditEmail = () => {
    setTempEmail(email);
    setIsEditingEmail(true);
  };

  const handleSaveEmail = () => {
    setEmail(tempEmail);
    setIsEditingEmail(false);
  };

  const handleCancelEdit = () => {
    setIsEditingEmail(false);
  };

  // Dynamic pricing calculation based on user selections
  const baseVisaFee = 129;
  const baseInsuranceFee = 400;
  const eVisaFee = 0; // Currently free

  const visaFees = travelers * baseVisaFee;
  const insuranceFees = insurance ? travelers * baseInsuranceFee : 0;
  const eVisaFees = evisa ? eVisaFee : 0;

  const subtotal = visaFees + insuranceFees + eVisaFees;
  const originalPrice = travelers * 250;
  const savings = originalPrice - subtotal;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-gilroy-bold text-gray-900 mb-8">
          Contact
        </h1>

        {/* Email Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border border-gray-200">
          <div className="flex items-center mb-4">
            <Mail className="text-[#7350FF] mr-3" size={20} />
            <h2 className="text-xl font-semibold">Email</h2>
          </div>
          <div className="pl-9">
            {isEditingEmail ? (
              <div className="mb-4">
                <div className="flex items-center">
                  <input
                    type="email"
                    value={tempEmail}
                    onChange={(e) => setTempEmail(e.target.value)}
                    className="flex-1 py-2 px-3 border outline-none border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 focus:ring-[2px]"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveEmail}
                    className="ml-2 p-2 text-green-600 hover:bg-green-50 rounded-full"
                  >
                    <Check size={20} />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="ml-1 p-2 text-gray-500 hover:bg-gray-50 rounded-full"
                  >
                    <ChevronDown size={20} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between mb-4">
                <p className="text-gray-700">{email}</p>
                <button
                  onClick={handleEditEmail}
                  className="p-1 text-[#7350FF] hover:bg-purple-50 rounded-full"
                >
                  <Edit size={18} />
                </button>
              </div>
            )}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="newsletter"
                checked={newsletter}
                onChange={() => setNewsletter(!newsletter)}
                className="h-4 w-4 text-[#7350FF] rounded border-gray-300 mr-3"
              />
              <label htmlFor="newsletter" className="text-gray-700">
                Email me with news and offers
              </label>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-8"></div>

        {/* Checkout Section */}
        <div>
          <h2 className="text-2xl font-gilroy-bold text-gray-900 mb-6">
            Proceed to Checkout 2
          </h2>
          <h3
            className="text-xl font-semibold text-gray-800 mb-6"
            suppressHydrationWarning
          >
            {visaState.selectedCountry
              ? `${visaState.selectedCountry} visa from the UK`
              : "Visa from the UK"}
          </h3>

          {/* Travelers */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-4 border border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <User className="text-[#7350FF] mr-3" size={20} />
                <span className="font-medium">Add additional travellers</span>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleTravelerChange(-1)}
                  disabled={travelers <= 1}
                  className={`p-1 rounded-full ${travelers <= 1
                      ? "text-gray-300"
                      : "text-[#7350FF] hover:bg-purple-50"
                    }`}
                >
                  <ChevronDown size={20} />
                </button>
                <span className="w-8 text-center">{travelers}</span>
                <button
                  onClick={() => handleTravelerChange(1)}
                  className="p-1 rounded-full text-[#7350FF] hover:bg-purple-50"
                >
                  <ChevronDown className="transform rotate-180" size={20} />
                </button>
              </div>
            </div>
            <div className="flex justify-between pl-9 mt-2">
              <span className="text-gray-600">Travellers ({travelers})</span>
              <div className="text-right">
                <span className="text-gray-500 line-through mr-2">
                  £{(travelers * 250).toFixed(2)}
                </span>
                <span className="font-medium">£{visaFees.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Insurance */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-4 border border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="insurance-checkbox"
                  checked={insurance}
                  onChange={(e) => setInsurance(e.target.checked)}
                  className="h-4 w-4 text-[#7350FF] rounded border-gray-300 mr-3"
                />
                <Shield className="text-[#7350FF] mr-3" size={20} />
                <span className="font-medium">Insurance certificate</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium">NEWYOU400</span>
                <span className="ml-2">(£{insuranceFees.toFixed(2)})</span>
              </div>
            </div>
            {insurance && (
              <div className="pl-9 text-sm text-gray-600">
                Coverage for {travelers} traveler{travelers > 1 ? "s" : ""}
              </div>
            )}
          </div>

          {/* E-Visa */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <CreditCard className="text-[#7350FF] mr-3" size={20} />
                <span className="font-medium">E visa card</span>
              </div>
              <span className="text-gray-600">Included</span>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-purple-200">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">
                Subtotal - {travelers + (insurance ? 1 : 0) + (evisa ? 1 : 0)}{" "}
                items
              </span>
              <span className="font-medium">£{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-3 border-t border-gray-200">
              <span className="font-semibold">You Save</span>
              <span className="text-green-600 font-semibold">
                £{savings.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between py-3 border-t border-gray-200">
              <span className="font-gilroy-bold text-lg">Total</span>
              <span className="font-gilroy-bold text-lg">
                £{subtotal.toFixed(2)}
              </span>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 text-center text-sm text-gray-600">
              100% Risk free - Get your visa or full refund
            </div>
          </div>

          {/* Checkout Button */}
          <button className="w-full mt-6 py-3 bg-[#7350FF] hover:bg-[#6247D3] text-white font-semibold rounded-lg shadow-md transition-colors">
            Proceed to Payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default index;
