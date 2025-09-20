import React, { useEffect, useRef, useState } from "react";
import { Home, Briefcase, Globe, Users, DollarSign } from "react-feather";
import { Plane } from "lucide-react";
import { createOrUpdateApplication } from "@/api/visaApplications";
import { localStorageGateway } from "@/gateways/localStoragegateway";
import { localStorageEnums } from "@/enums/localstorage.enums";
import { useAppSelector } from "@/store";

const VisitDetailSection = ({
  visitData,
  setVisitData,
  parentVisaApplication,
  setParentVisaApplication,
  onComplete,
}) => {
  const visaState = useAppSelector((state) => state.visa);
  const selectedCountry = visaState.selectedCountry || "UK";
  // console.log(
  //   "parentVisaApplication.id ::: parentVisaApplication.id ::: ",
  //   parentVisaApplication.id
  // );
  const inputRef = useRef(null);
  const [isFirstRender, setIsFirstRender] = useState(true);
  const token = localStorageGateway("token", localStorageEnums.GET);

  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setVisitData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setVisitData((prev) => ({
      ...prev,
      [name]: checked,
      [name === "hasVisitSponsor"
        ? "noVisitSponsor"
        : name === "noVisitSponsor"
        ? "hasVisitSponsor"
        : name === "hasUkTravelHistory"
        ? "noUkTravelHistory"
        : name === "noUkTravelHistory"
        ? "hasUkTravelHistory"
        : name === "hasSpecificCountryTravel"
        ? "noSpecificCountryTravel"
        : name === "noSpecificCountryTravel"
        ? "hasSpecificCountryTravel"
        : name === "hasOtherCountryTravel"
        ? "noOtherCountryTravel"
        : "hasOtherCountryTravel"]: false,
    }));
  };

  const handleNumberInput = (e) => {
    const { name, value } = e.target;
    e.preventDefault();
    setVisitData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const QuestionCard = ({ icon, title, children }) => (
    <div className="sec_bg rounded-xl shadow-sm p-6 border public_border_clr mb-6">
      <div className="flex items-center mb-4">
        <div className="bg-purple-100 p-2 rounded-lg text-[#7350FF] mr-3">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      {children}
    </div>
  );

  const RadioGroup = ({ name, options, value, onChange }) => (
    <div className="space-y-3">
      {options.map((option) => (
        <label
          key={option}
          className="flex items-center space-x-3 cursor-pointer"
        >
          <input
            type="radio"
            name={name}
            value={option}
            checked={value === option}
            onChange={onChange}
            className="hidden"
          />
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition 
            ${
              value === option
                ? "border-[#7350FF] bg-[#7350FF]"
                : "border-gray-300"
            }`}
          >
            {value === option && (
              <div className="w-2 h-2 rounded-full bg-white"></div>
            )}
          </div>
          <span className="text-white/80">{option}</span>
        </label>
      ))}
      {errors[name] && (
        <p className="text-red-500 text-xs mt-1">{errors[name]}</p>
      )}
    </div>
  );

  const CheckboxOption = ({ name, label, checked, onChange }) => (
    <label className="flex items-center space-x-3 cursor-pointer">
      <input
        type="checkbox"
        name={name}
        checked={checked || false}
        onChange={onChange}
        className="hidden"
      />
      <div
        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition 
        ${
          checked ? "bg-[#7350FF] border-[#7350FF]" : "bg-white border-gray-300"
        }`}
      >
        {checked && (
          <svg
            className="w-3 h-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </div>
      <span className="text-white/80">{label}</span>
    </label>
  );

  const validateForm = () => {
    const newErrors = {};

    // Validate new required fields
    if (!visitData?.travelPurpose)
      newErrors.travelPurpose = "Please select a purpose of visit";
    if (!visitData?.entryDate) newErrors.entryDate = "Please select entry date";
    if (!visitData?.exitDate) newErrors.exitDate = "Please select exit date";

    // Validate date logic
    if (visitData?.entryDate && visitData?.exitDate) {
      const entryDate = new Date(visitData.entryDate);
      const exitDate = new Date(visitData.exitDate);
      const today = new Date();

      if (entryDate < today) {
        newErrors.entryDate = "Entry date cannot be in the past";
      }
      if (exitDate <= entryDate) {
        newErrors.exitDate = "Exit date must be after entry date";
      }
    }

    // Existing validation
    if (!visitData?.countryVisaHistory)
      newErrors.countryVisaHistory = "Required";
    if (!visitData?.maritalStatus) newErrors.maritalStatus = "Required";
    if (!visitData?.hasDependents) newErrors.hasDependents = "Required";
    if (!visitData?.residentialStatus) newErrors.residentialStatus = "Required";
    if (!visitData?.addressDuration) newErrors.addressDuration = "Required";
    if (!visitData?.employmentStatus) newErrors.employmentStatus = "Required";
    if (!visitData?.hasOtherIncome) newErrors.hasOtherIncome = "Required";
    if (!visitData?.hasSavings) newErrors.hasSavings = "Required";
    if (
      !visitData?.monthlyExpenditure ||
      Number(visitData?.monthlyExpenditure) <= 0
    )
      newErrors.monthlyExpenditure = "Enter a valid amount";
    if (!visitData?.hasVisitSponsor && !visitData?.noVisitSponsor)
      newErrors.visitSponsor = "Please select Yes or No";
    if (!visitData?.hasUkTravelHistory && !visitData?.noUkTravelHistory)
      newErrors.ukTravel = "Please select Yes or No";
    if (
      !visitData?.hasSpecificCountryTravel &&
      !visitData?.noSpecificCountryTravel
    )
      newErrors.specificCountry = "Please select Yes or No";
    if (!visitData?.hasOtherCountryTravel && !visitData?.noOtherCountryTravel)
      newErrors.otherCountry = "Please select Yes or No";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      onComplete(visitData);
    }
  };
  useEffect(() => {
    if (isFirstRender) {
      if (visitData?.monthlyExpenditure) {
        setIsFirstRender(false);
      }
      return; // skip first render
    }
    if (!isFirstRender) {
      inputRef.current?.focus();
    }
  }, [visitData?.monthlyExpenditure]);

  if (!parentVisaApplication) return null;

  console.log(selectedCountry);

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {/* Travel Purpose and Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <QuestionCard icon={<Plane size={20} />} title="Travel Purpose">
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white mb-2">
                Purpose of Visit
              </label>
              <select
                name="travelPurpose"
                value={visitData?.travelPurpose || ""}
                onChange={handleInputChange}
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-[#7350FF] focus:border-transparent"
                required
              >
                <option value="" className="text-black">
                  Select purpose
                </option>
                <option value="Tourism" className="text-black">
                  Tourism
                </option>
                <option value="Business" className="text-black">
                  Business
                </option>
                <option value="Study" className="text-black">
                  Study
                </option>
                <option value="Transit" className="text-black">
                  Transit
                </option>
                <option value="Visit Family/Friends" className="text-black">
                  Visit Family/Friends
                </option>
                <option value="Medical Treatment" className="text-black">
                  Medical Treatment
                </option>
                <option value="Other" className="text-black">
                  Other
                </option>
              </select>
              {errors.travelPurpose && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.travelPurpose}
                </p>
              )}
            </div>
          </div>
        </QuestionCard>

        <QuestionCard icon={<Globe size={20} />} title="Travel Dates">
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white mb-2">
                Planned Entry Date
              </label>
              <input
                type="date"
                name="entryDate"
                value={visitData?.entryDate || ""}
                onChange={handleInputChange}
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-[#7350FF] focus:border-transparent"
                required
              />
              {errors.entryDate && (
                <p className="text-red-500 text-xs mt-1">{errors.entryDate}</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-white mb-2">
                Planned Exit Date
              </label>
              <input
                type="date"
                name="exitDate"
                value={visitData?.exitDate || ""}
                onChange={handleInputChange}
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-[#7350FF] focus:border-transparent"
                required
              />
              {errors.exitDate && (
                <p className="text-red-500 text-xs mt-1">{errors.exitDate}</p>
              )}
            </div>
          </div>
        </QuestionCard>
      </div>

      {/* UK Visa History */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <QuestionCard
          icon={<Plane size={20} />}
          title={`${parentVisaApplication?.country} Visa History`}
          suppressHydrationWarning
        >
          <p className="text-sm text-white mb-4" suppressHydrationWarning>
            Have you been issued with a {parentVisaApplication?.country} visa in
            the past 10 years?
          </p>
          <RadioGroup
            name="countryVisaHistory"
            options={["Yes", "No"]}
            value={visitData?.countryVisaHistory}
            onChange={handleInputChange}
          />
        </QuestionCard>

        {/* Personal Information */}
        <QuestionCard icon={<Users size={20} />} title="Personal Information">
          <div className="space-y-6">
            <div>
              <p className="text-sm text-white mb-3">
                What is your marital status?
              </p>
              <RadioGroup
                name="maritalStatus"
                options={[
                  "Single",
                  "Married",
                  "Divorced",
                  "Widowed",
                  "Unmarried partner",
                  "Separated",
                ]}
                value={visitData.maritalStatus}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <p className="text-sm text-white mb-3">
                Do you have any dependents in {parentVisaApplication?.country}?
              </p>
              <RadioGroup
                name="hasDependents"
                options={["Yes", "No"]}
                value={visitData?.hasDependents}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </QuestionCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Residential Information */}
        <QuestionCard icon={<Home size={20} />} title="Residential Information">
          <div className="space-y-6">
            <div>
              <p className="text-sm text-white mb-3">
                Is your address owned or rented?
              </p>
              <RadioGroup
                name="residentialStatus"
                options={["Owned", "Rented"]}
                value={visitData?.residentialStatus}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <p className="text-sm text-white mb-3">
                How long have you stayed at this address?
              </p>
              <RadioGroup
                name="addressDuration"
                options={["0-10 months", "10+ months"]}
                value={visitData?.addressDuration}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </QuestionCard>

        {/* Employment & Financial Information */}
        <QuestionCard
          icon={<Briefcase size={20} />}
          title="Employment & Financial Information"
        >
          <div className="space-y-6">
            <div>
              <p className="text-sm text-white mb-3">
                What is your employment status?
              </p>
              <RadioGroup
                name="employmentStatus"
                options={[
                  "Student",
                  "Employed",
                  "Self Employed",
                  "Retired",
                  "Unemployed",
                  "Other",
                ]}
                value={visitData?.employmentStatus}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <p className="text-sm text-white mb-3">
                Do you have other income?
              </p>
              <RadioGroup
                name="hasOtherIncome"
                options={["Yes", "No"]}
                value={visitData?.hasOtherIncome}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <p className="text-sm text-white mb-3">Do you have savings?</p>
              <RadioGroup
                name="hasSavings"
                options={["Yes", "No"]}
                value={visitData?.hasSavings}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <p className="text-sm text-white mb-3">Monthly expenditure</p>
              <div className="flex items-center gap-3 pri_bg p-3 rounded-lg">
                <span className="text-white/80">₹</span>
                <input
                  ref={inputRef}
                  type="number"
                  name="monthlyExpenditure"
                  value={visitData?.monthlyExpenditure || ""}
                  onChange={(e) =>
                    setVisitData((prev) => ({
                      ...prev,
                      monthlyExpenditure: e.target.value,
                    }))
                  }
                  placeholder="Enter amount"
                  className="flex-grow bg-transparent border-b text-white public_border_clr focus:border-purple-500 outline-none py-1"
                />
                <span className="text-gray-300 text-sm">per month</span>
              </div>
              {errors.monthlyExpenditure && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.monthlyExpenditure}
                </p>
              )}
            </div>
          </div>
        </QuestionCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Visit Sponsorship */}
        <QuestionCard icon={<DollarSign size={20} />} title="Visit Sponsorship">
          <p className="text-sm text-white mb-4">
            Will anyone pay for your visit?
          </p>
          <div className="space-y-3">
            <CheckboxOption
              name="hasVisitSponsor"
              label="Yes"
              checked={visitData?.hasVisitSponsor || false}
              onChange={handleCheckboxChange}
            />
            <CheckboxOption
              name="noVisitSponsor"
              label="No"
              checked={visitData?.noVisitSponsor || false}
              onChange={handleCheckboxChange}
            />
          </div>
          {errors.visitSponsor && (
            <p className="text-red-500 text-xs mt-1">{errors.visitSponsor}</p>
          )}
        </QuestionCard>

        {/* Travel History */}
        <QuestionCard icon={<Globe size={20} />} title="Travel History">
          <div className="space-y-6">
            <div>
              <p className="text-sm text-white mb-4">UK Travel History</p>
              <div className="space-y-3">
                <CheckboxOption
                  name="hasUkTravelHistory"
                  label="Yes"
                  checked={visitData?.hasUkTravelHistory || false}
                  onChange={handleCheckboxChange}
                />
                <CheckboxOption
                  name="noUkTravelHistory"
                  label="No"
                  checked={visitData?.noUkTravelHistory || false}
                  onChange={handleCheckboxChange}
                />
              </div>
              {errors.ukTravel && (
                <p className="text-red-500 text-xs mt-1">{errors.ukTravel}</p>
              )}
            </div>

            <div>
              <p className="text-sm text-white mb-4">
                Specific Countries Travel
              </p>
              <div className="space-y-3">
                <CheckboxOption
                  name="hasSpecificCountryTravel"
                  label="Yes"
                  checked={visitData?.hasSpecificCountryTravel || false}
                  onChange={handleCheckboxChange}
                />
                <CheckboxOption
                  name="noSpecificCountryTravel"
                  label="No"
                  checked={visitData?.noSpecificCountryTravel || false}
                  onChange={handleCheckboxChange}
                />
              </div>
              {errors.specificCountry && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.specificCountry}
                </p>
              )}
            </div>

            <div>
              <p className="text-sm text-white mb-4">Other Countries Travel</p>
              <div className="space-y-3">
                <CheckboxOption
                  name="hasOtherCountryTravel"
                  label="Yes"
                  checked={visitData?.hasOtherCountryTravel || false}
                  onChange={handleCheckboxChange}
                />
                <CheckboxOption
                  name="noOtherCountryTravel"
                  label="No"
                  checked={visitData?.noOtherCountryTravel || false}
                  onChange={handleCheckboxChange}
                />
              </div>
              {errors.otherCountry && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.otherCountry}
                </p>
              )}
            </div>
          </div>
        </QuestionCard>
      </div>

      <button
        type="submit"
        className="bg-[#7350FF] text-white px-6 py-2 rounded-lg hover:bg-[#6247D3] transition"
      >
        Submit
      </button>
    </form>
  );
};

export default VisitDetailSection;
