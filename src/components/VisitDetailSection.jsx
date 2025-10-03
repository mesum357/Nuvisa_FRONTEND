import { localStorageEnums } from "@/enums/localstorage.enums";
import { localStorageGateway } from "@/gateways/localStoragegateway";
import { useAppSelector } from "@/store";
import { Plane } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Briefcase, Globe, Users, ChevronDown } from "react-feather";
import { schengenCountries } from "./CountrySelector";

// Multi-select dropdown component
const MultiSelectDropdown = ({
  name,
  options,
  value,
  onChange,
  disabled = false,
  placeholder,
  errors,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  // Convert value to array if it's a string or null/undefined
  const selectedValues = Array.isArray(value) ? value : value ? [value] : [];

  // Filter options based on search term
  const filteredOptions = options.filter((option) =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelectAll = () => {
    if (disabled) return;
    const allCountries = filteredOptions.map((option) => option.name);
    onChange(allCountries);
  };

  const handleCountryToggle = (countryName) => {
    if (disabled) return;
    let newSelectedValues;
    if (selectedValues.includes(countryName)) {
      newSelectedValues = selectedValues.filter((val) => val !== countryName);
    } else {
      newSelectedValues = [...selectedValues, countryName];
    }

    // Call onChange directly with the new values array
    onChange(newSelectedValues);
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length <= 4) return selectedValues.join(", ");
    return `${selectedValues.slice(0, 4).join(", ")}...`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className={`w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-[#7350FF] focus:border-transparent flex items-center justify-between ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
          }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span
          className={
            selectedValues.length === 0 ? "text-white/50" : "text-white"
          }
        >
          {getDisplayText()}
        </span>
        <ChevronDown
          className={`w-5 h-5 transition-transform ${isOpen ? "rotate-180" : ""
            }`}
        />
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 sec_bg public_border_clr text-white rounded-lg border shadow-lg max-h-80 overflow-hidden">
          <div className="p-3">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#7350FF] !text-white"
            />
          </div>

          <div className="max-h-60 overflow-y-auto">
            <div className="px-3 py-2 border-b public_border_clr hover:bg-white/10">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={
                    filteredOptions.length > 0 &&
                    filteredOptions.every((option) =>
                      selectedValues.includes(option.name)
                    )
                  }
                  onChange={handleSelectAll}
                  className="w-4 h-4 !text-white public_border_clr rounded focus:ring-white"
                />
                <span className="text-white font-medium">Select All</span>
              </label>
            </div>

            {filteredOptions.map((option) => (
              <div key={option.code} className="px-3 py-2 hover:bg-white/10">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(option.name)}
                    onChange={() => handleCountryToggle(option.name)}
                    className="w-4 h-4 text-white public_border_clr rounded focus:ring-white"
                  />
                  <span className="text-white">{option.name}</span>
                </label>
              </div>
            ))}

            {/* Not Applicable option */}
            <div className="px-3 py-2 hover:bg-white/10 public_border_clr border-t">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedValues.includes("Not Applicable")}
                  onChange={() => handleCountryToggle("Not Applicable")}
                  className="w-4 h-4 text-[#7350FF] border-gray-300 rounded focus:ring-[#7350FF]"
                />
                <span className="text-white">Not Applicable</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {errors && errors[name] && (
        <p className="text-red-500 text-xs mt-1">{errors[name]}</p>
      )}
    </div>
  );
};

// Move component definitions outside to prevent recreation on every render
const QuestionCard = ({ icon: _icon, title, children }) => (
  <div className="rounded-xl">
    <div className="flex items-center mb-2">
      {/* <div className="bg-purple-100 p-2 rounded-lg text-[#7350FF] mr-3">
        {icon}
      </div> */}
      <h3 className=" font-gilroy-bold text-white">{title}</h3>
    </div>
    {children}
  </div>
);

const RadioGroup = ({ name, options, value, onChange, errors, disabled = false }) => (
  <div className="space-y-3">
    <div className="gap-3 flex items-center flex-wrap">
      {options.map((option) => (
        <label
          key={option}
          className={`flex items-center space-x-3 sec_bg p-2 px-4 ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
            }`}
        >
          <input
            type="radio"
            name={name}
            value={option}
            checked={value === option}
            onChange={disabled ? () => { } : (e) => onChange(e.target.value)}
            disabled={disabled}
            className="hidden"
          />
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition 
          ${value === option
                ? "border-[#7350FF] bg-[#7350FF]"
                : "border-gray-300"
              }`}
          >
            {value === option && (
              <div className="w-2 h-2 rounded-full bg-white"></div>
            )}
          </div>
          <span className={value === option ? "text-white" : "text-white/70"}>
            {option}
          </span>
        </label>
      ))}
    </div>
    {errors && errors[name] && (
      <p className="text-red-500 text-xs mt-1">{errors[name]}</p>
    )}
  </div>
);

const _CheckboxOption = ({ name, label, checked, onChange }) => (
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
      ${checked ? "bg-[#7350FF] border-[#7350FF]" : "bg-white border-gray-300"
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

const VisitDetailSection = ({
  visitData,
  setVisitData,
  parentVisaApplication,
  setParentVisaApplication: _setParentVisaApplication,
  onComplete,
  loading,
  disabled = false,
}) => {
  const visaState = useAppSelector((state) => state.visa);
  const _selectedCountry = visaState.selectedCountry || "UK";

  const _token = localStorageGateway("token", localStorageEnums.GET);

  const [errors, setErrors] = useState({});
  const [touchedSubmit, setTouchedSubmit] = useState(false);


  const handleInputChange = (e) => {
    if (disabled) return;
    const { name, value } = e.target;
    setVisitData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRadioChange = (name, value) => {
    if (disabled) return;
    setVisitData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMultiSelectChange = (name, selectedOptions) => {
    if (disabled) return;
    setVisitData((prev) => ({
      ...prev,
      [name]: selectedOptions,
    }));
  };

  const _handleCheckboxChange = (e) => {
    if (disabled) return;
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

  const _handleNumberInput = (e) => {
    const { name, value } = e.target;
    e.preventDefault();
    setVisitData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const newErrors = {};


    // Only validate fields that are actually visible in the current form

    // 1. Schengen countries selection (always visible)
    if (
      !visitData?.visitingOtherSchengenCountries ||
      (Array.isArray(visitData.visitingOtherSchengenCountries) &&
        visitData.visitingOtherSchengenCountries.length === 0)
    ) {
      newErrors.visitingOtherSchengenCountries =
        "Please select at least one option";
    }

    // 2. First country of entry (always visible)
    if (!visitData?.firstCountryOfEntry) {
      newErrors.firstCountryOfEntry = "Please select first country of entry";
    }

    // 3. Schengen visa question (always visible)
    if (!visitData?.hasSchengenVisa) {
      newErrors.hasSchengenVisa = "Please select Yes or No";
    }

    // 4. Conditional Schengen visa date fields (only required if user selected "Yes")
    if (visitData?.hasSchengenVisa === "Yes") {
      if (!visitData?.lastVisaStartDate) {
        newErrors.lastVisaStartDate = "Please select last visa start date";
      }
      if (!visitData?.lastVisaEndDate) {
        newErrors.lastVisaEndDate = "Please select last visa end date";
      }

      // Validate date logic for visa dates (only if both dates are provided)
      if (visitData?.lastVisaStartDate && visitData?.lastVisaEndDate) {
        const startDate = new Date(visitData.lastVisaStartDate);
        const endDate = new Date(visitData.lastVisaEndDate);

        if (endDate <= startDate) {
          newErrors.lastVisaEndDate = "End date must be after start date";
        }
      }
    }

    // 5. Digital fingerprints question (always visible)
    if (!visitData?.hasDigitalFingerprints) {
      newErrors.hasDigitalFingerprints = "Please select Yes or No";
    } else {
    }

    // 6. Conditional previous visa number (only required if user selected "Yes" for digital fingerprints)
    if (visitData?.hasDigitalFingerprints === "Yes") {
      if (
        !visitData?.previousVisaNumber ||
        visitData.previousVisaNumber.trim() === ""
      ) {
        newErrors.previousVisaNumber =
          "Please provide your previous visa number";
      }
    }

    // 7. Marital status (always visible)
    if (!visitData?.maritalStatus) {
      newErrors.maritalStatus = "Required";
    }

    // 8. Conditional partner fields (only required if user selected "Married")
    if (visitData?.maritalStatus === "Married") {
      if (!visitData?.partnerDateOfBirth) {

        newErrors.partnerDateOfBirth = "Please provide partner's date of birth";
      }
      if (
        !visitData?.partnerFullName ||
        visitData.partnerFullName.trim() === ""
      ) {

        newErrors.partnerFullName = "Please provide partner's full name";
      }

      // Validate partner date of birth is not in the future (only if provided)
      if (visitData?.partnerDateOfBirth) {
        const partnerBirthDate = new Date(visitData.partnerDateOfBirth);
        const today = new Date();

        if (partnerBirthDate > today) {
          newErrors.partnerDateOfBirth =
            "Date of birth cannot be in the future";
        }
      }
    }

    // 9. Employment status (always visible)
    if (!visitData?.employmentStatus) {
      newErrors.employmentStatus = "Required";
    }

    // 10. Conditional Student fields (only required if user selected "Student")
    if (visitData?.employmentStatus === "Student") {
      if (
        !visitData?.institutionName ||
        visitData.institutionName.trim() === ""
      ) {

        newErrors.institutionName = "Please provide institution name";
      }
      if (
        !visitData?.instituteEmail ||
        visitData.instituteEmail.trim() === ""
      ) {
        newErrors.instituteEmail = "Please provide institute email";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(visitData.instituteEmail)) {
        newErrors.instituteEmail = "Please provide a valid email address";
      }
      if (
        !visitData?.instituteAddress ||
        visitData.instituteAddress.trim() === ""
      ) {

        newErrors.instituteAddress = "Please provide institute address";
      }
    }

    // 11. Conditional Employed fields (only required if user selected "Employed")
    if (visitData?.employmentStatus === "Employed") {
      if (!visitData?.employerPhone || visitData.employerPhone.trim() === "") {

        newErrors.employerPhone = "Please provide employer phone number";
      }
      if (!visitData?.employerName || visitData.employerName.trim() === "") {
        newErrors.employerName = "Please provide employer name";
      }
      if (!visitData?.employerEmail || visitData.employerEmail.trim() === "") {

        newErrors.employerEmail = "Please provide employer email";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(visitData.employerEmail)) {
        newErrors.employerEmail = "Please provide a valid email address";
      }
      if (
        !visitData?.employerAddress ||
        visitData.employerAddress.trim() === ""
      ) {

        newErrors.employerAddress = "Please provide employer address";
      }
    }

    // 12. Conditional Other employment status field (only required if user selected "Other")
    if (visitData?.employmentStatus === "Other") {
      if (
        !visitData?.otherEmploymentStatus ||
        visitData.otherEmploymentStatus.trim() === ""
      ) {

        newErrors.otherEmploymentStatus =
          "Please specify other employment status";
      }
    }

    // 13. Payment question (always visible)
    if (!visitData?.willAnyonePayForVisit) {
      newErrors.willAnyonePayForVisit = "Please select Yes or No";
    }

    // 14. Conditional funding fields (only required if user selected "Yes" for payment)
    if (visitData?.willAnyonePayForVisit === "Yes") {
      if (
        !visitData?.fundingPersonName ||
        visitData.fundingPersonName.trim() === ""
      ) {

        newErrors.fundingPersonName =
          "Please provide name of the person/org who will fund";
      }
      if (!visitData?.tripFundedBy) {

        newErrors.tripFundedBy = "Please select who will fund your trip";
      }
    }


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (disabled) return; // Prevent form submission when disabled



    setTouchedSubmit(true);

    const isValid = validateForm();
    if (isValid) {
      onComplete(visitData);
    }
  };


  if (!parentVisaApplication) return null;

  return (
    <form className="space-y-6 p-3" onSubmit={handleSubmit}>
      {/* Travel Purpose and Dates */}
      <div className="grid grid-cols-1 gap-6">
        <QuestionCard
          icon={<Plane size={20} />}
          title="Are you visiting any other Schengen countries during your stay? (Check dropdown for a list of Schengen countries)"
        >
          <div className="space-y-4">
            <div>
              {/* <label className="block text-sm text-white mb-2">
                Are you visiting any other Schengen countries during your stay?
                (Check dropdown for a list of Schengen countries)
              </label> */}
              <MultiSelectDropdown
                name="visitingOtherSchengenCountries"
                options={schengenCountries}
                value={visitData?.visitingOtherSchengenCountries || []}
                onChange={(selectedOptions) =>
                  handleMultiSelectChange(
                    "visitingOtherSchengenCountries",
                    selectedOptions
                  )
                }
                placeholder="Germany, Austria, Belgium, Croatia"
                errors={errors}
                disabled={disabled}
              />
            </div>
          </div>
        </QuestionCard>

        <QuestionCard
          icon={<Globe size={20} />}
          title="What is your first country of entry?"
        >
          <select
            name="firstCountryOfEntry"
            value={visitData?.firstCountryOfEntry || ""}
            onChange={handleInputChange}
            className={`w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-[#7350FF] focus:border-transparent ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
              }`}
            required
            disabled={disabled}
          >
            <option value="" className="text-black">
              Select
            </option>

            {schengenCountries.map((country) => (
              <option
                key={country.code}
                value={country.name}
                className="text-black"
              >
                {country.name}
              </option>
            ))}
          </select>
          {errors.firstCountryOfEntry && (
            <p className="text-red-500 text-xs mt-1">
              {errors.firstCountryOfEntry}
            </p>
          )}
        </QuestionCard>
      </div>

      {/* UK Visa History */}
      <div className="grid grid-cols-1 gap-6">
        <QuestionCard
          icon={<Plane size={20} />}
          title={`Have you been issued Schengen visa in the past 5 years?`}
          suppressHydrationWarning
        >
          <RadioGroup
            name="hasSchengenVisa"
            options={["Yes", "No"]}
            value={visitData?.hasSchengenVisa}
            onChange={(value) => handleRadioChange("hasSchengenVisa", value)}
            errors={errors}
            disabled={disabled}
          />
        </QuestionCard>

        {/* Date fields - show only when Yes is selected for Schengen visa */}
        {visitData?.hasSchengenVisa === "Yes" && (
          <>
            <QuestionCard
              icon={<Plane size={20} />}
              title="Last visa start date"
            >
              <input
                type="date"
                name="lastVisaStartDate"
                value={visitData?.lastVisaStartDate || ""}
                onChange={disabled ? () => { } : handleInputChange}
                disabled={disabled}
                placeholder="dd-mm-yyyy"
                className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:border-transparent [&::-webkit-calendar-picker-indicator]:invert ${disabled
                  ? "bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  : "bg-white/10 border-white/20 text-white focus:ring-[#7350FF]"
                  }`}
              />
              {errors.lastVisaStartDate && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.lastVisaStartDate}
                </p>
              )}
            </QuestionCard>

            <QuestionCard icon={<Plane size={20} />} title="Last visa end date">
              <input
                type="date"
                name="lastVisaEndDate"
                value={visitData?.lastVisaEndDate || ""}
                onChange={disabled ? () => { } : handleInputChange}
                disabled={disabled}
                placeholder="dd-mm-yyyy"
                className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:border-transparent [&::-webkit-calendar-picker-indicator]:invert ${disabled
                  ? "bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  : "bg-white/10 border-white/20 text-white focus:ring-[#7350FF]"
                  }`}
              />
              {errors.lastVisaEndDate && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.lastVisaEndDate}
                </p>
              )}
            </QuestionCard>
          </>
        )}

        <QuestionCard
          icon={<Plane size={20} />}
          title={`Have your digital fingerprints previously been taken in connection with a previous application for a Schengen visa?`}
          suppressHydrationWarning
        >
          <RadioGroup
            name="hasDigitalFingerprints"
            options={["Yes", "No"]}
            value={visitData?.hasDigitalFingerprints}
            onChange={(value) =>
              handleRadioChange("hasDigitalFingerprints", value)
            }
            errors={errors}
            disabled={disabled}
          />
        </QuestionCard>

        {/* Visa number field - show only when Yes is selected for digital fingerprints */}
        {visitData?.hasDigitalFingerprints === "Yes" && (
          <QuestionCard
            icon={<Plane size={20} />}
            title="Please provide your previous visa number"
          >
            <input
              type="text"
              name="previousVisaNumber"
              value={visitData?.previousVisaNumber || ""}
              onChange={handleInputChange}
              placeholder="Visa Number"
              className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#7350FF] focus:border-transparent"
            />
            {errors.previousVisaNumber && (
              <p className="text-red-500 text-xs mt-1">
                {errors.previousVisaNumber}
              </p>
            )}
          </QuestionCard>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Residential Information */}
        <QuestionCard
          icon={<Users size={20} />}
          title="What is your marital status?"
        >
          <div className="space-y-6">
            <div>
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
                onChange={(value) => handleRadioChange("maritalStatus", value)}
                errors={errors}
                disabled={disabled}
              />
            </div>
          </div>
        </QuestionCard>

        {/* Partner fields - show only when Married is selected */}
        {visitData?.maritalStatus === "Married" && (
          <>
            <QuestionCard
              icon={<Users size={20} />}
              title="Partner's date of birth"
            >
              <input
                type="date"
                name="partnerDateOfBirth"
                value={visitData?.partnerDateOfBirth || ""}
                onChange={disabled ? () => { } : handleInputChange}
                disabled={disabled}
                placeholder="dd-mm-yyyy"
                className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:border-transparent [&::-webkit-calendar-picker-indicator]:invert ${disabled
                  ? "bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  : "bg-white/10 border-white/20 text-white focus:ring-[#7350FF]"
                  }`}
              />
              {errors.partnerDateOfBirth && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.partnerDateOfBirth}
                </p>
              )}
            </QuestionCard>

            <QuestionCard
              icon={<Users size={20} />}
              title="Partner's full name"
            >
              <input
                type="text"
                name="partnerFullName"
                value={visitData?.partnerFullName || ""}
                onChange={disabled ? () => { } : handleInputChange}
                disabled={disabled}
                placeholder="Partner name"
                className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:border-transparent ${disabled
                  ? "bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 placeholder-gray-400 cursor-not-allowed"
                  : "bg-white/10 border-white/20 text-white placeholder-white/50 focus:ring-[#7350FF]"
                  }`}
              />
              {errors.partnerFullName && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.partnerFullName}
                </p>
              )}
            </QuestionCard>
          </>
        )}

        {/* Employment & Financial Information */}
        <QuestionCard
          icon={<Briefcase size={20} />}
          title="What is your employment status?"
        >
          <div className="space-y-6">
            <div>
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
                onChange={(value) =>
                  handleRadioChange("employmentStatus", value)
                }
                errors={errors}
                disabled={disabled}
              />
            </div>
          </div>
        </QuestionCard>

        {/* Student fields - show only when Student is selected */}
        {visitData?.employmentStatus === "Student" && (
          <>
            <QuestionCard
              icon={<Briefcase size={20} />}
              title="Name of the Institution"
            >
              <input
                type="text"
                name="institutionName"
                value={visitData?.institutionName || ""}
                onChange={disabled ? () => { } : handleInputChange}
                disabled={disabled}
                placeholder="Name"
                className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:border-transparent ${disabled
                  ? "bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 placeholder-gray-400 cursor-not-allowed"
                  : "bg-white/10 border-white/20 text-white placeholder-white/50 focus:ring-[#7350FF]"
                  }`}
              />
              {errors.institutionName && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.institutionName}
                </p>
              )}
            </QuestionCard>

            <QuestionCard
              icon={<Briefcase size={20} />}
              title="Institute email"
            >
              <input
                type="email"
                name="instituteEmail"
                value={visitData?.instituteEmail || ""}
                onChange={disabled ? () => { } : handleInputChange}
                disabled={disabled}
                placeholder="Email"
                className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:border-transparent ${disabled
                  ? "bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 placeholder-gray-400 cursor-not-allowed"
                  : "bg-white/10 border-white/20 text-white placeholder-white/50 focus:ring-[#7350FF]"
                  }`}
              />
              {errors.instituteEmail && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.instituteEmail}
                </p>
              )}
            </QuestionCard>

            <QuestionCard
              icon={<Briefcase size={20} />}
              title="Institute address"
            >
              <textarea
                name="instituteAddress"
                value={visitData?.instituteAddress || ""}
                onChange={disabled ? () => { } : handleInputChange}
                disabled={disabled}
                placeholder="Address"
                rows={4}
                className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:border-transparent resize-none ${disabled
                  ? "bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 placeholder-gray-400 cursor-not-allowed"
                  : "bg-white/10 border-white/20 text-white placeholder-white/50 focus:ring-[#7350FF]"
                  }`}
              />
              {errors.instituteAddress && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.instituteAddress}
                </p>
              )}
            </QuestionCard>
          </>
        )}

        {/* Employed fields - show only when Employed is selected */}
        {visitData?.employmentStatus === "Employed" && (
          <>
            <QuestionCard
              icon={<Briefcase size={20} />}
              title="Employer/Organization telephone/mobile number"
            >
              <input
                type="tel"
                name="employerPhone"
                value={visitData?.employerPhone || ""}
                onChange={disabled ? () => { } : handleInputChange}
                disabled={disabled}
                placeholder="Number"
                className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:border-transparent ${disabled
                  ? "bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 placeholder-gray-400 cursor-not-allowed"
                  : "bg-white/10 border-white/20 text-white placeholder-white/50 focus:ring-[#7350FF]"
                  }`}
              />
              {errors.employerPhone && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.employerPhone}
                </p>
              )}
            </QuestionCard>

            <QuestionCard
              icon={<Briefcase size={20} />}
              title="Name of the employer/organization"
            >
              <input
                type="text"
                name="employerName"
                value={visitData?.employerName || ""}
                onChange={disabled ? () => { } : handleInputChange}
                disabled={disabled}
                placeholder="Enter here"
                className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:border-transparent ${disabled
                  ? "bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 placeholder-gray-400 cursor-not-allowed"
                  : "bg-white/10 border-white/20 text-white placeholder-white/50 focus:ring-[#7350FF]"
                  }`}
              />
              {errors.employerName && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.employerName}
                </p>
              )}
            </QuestionCard>

            <QuestionCard
              icon={<Briefcase size={20} />}
              title="Employer/Organization email"
            >
              <input
                type="email"
                name="employerEmail"
                value={visitData?.employerEmail || ""}
                onChange={disabled ? () => { } : handleInputChange}
                disabled={disabled}
                placeholder="johndoe@gmail.com"
                className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:border-transparent ${disabled
                  ? "bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 placeholder-gray-400 cursor-not-allowed"
                  : "bg-white/10 border-white/20 text-white placeholder-white/50 focus:ring-[#7350FF]"
                  }`}
              />
              {errors.employerEmail && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.employerEmail}
                </p>
              )}
            </QuestionCard>

            <QuestionCard
              icon={<Briefcase size={20} />}
              title="Employer/Organization address"
            >
              <textarea
                name="employerAddress"
                value={visitData?.employerAddress || ""}
                onChange={disabled ? () => { } : handleInputChange}
                disabled={disabled}
                placeholder="Address"
                rows={4}
                className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:border-transparent resize-none ${disabled
                  ? "bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 placeholder-gray-400 cursor-not-allowed"
                  : "bg-white/10 border-white/20 text-white placeholder-white/50 focus:ring-[#7350FF]"
                  }`}
              />
              {errors.employerAddress && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.employerAddress}
                </p>
              )}
            </QuestionCard>
          </>
        )}

        {/* Other employment status field - show only when Other is selected */}
        {visitData?.employmentStatus === "Other" && (
          <QuestionCard
            icon={<Briefcase size={20} />}
            title="Other employment status"
          >
            <input
              type="text"
              name="otherEmploymentStatus"
              value={visitData?.otherEmploymentStatus || ""}
              onChange={handleInputChange}
              placeholder="Other employment status"
              className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#7350FF] focus:border-transparent"
            />
            {errors.otherEmploymentStatus && (
              <p className="text-red-500 text-xs mt-1">
                {errors.otherEmploymentStatus}
              </p>
            )}
          </QuestionCard>
        )}

        <QuestionCard
          icon={<Briefcase size={20} />}
          title="Will anyone be paying towards the cost of your visit?"
        >
          <div className="space-y-6">
            <div>
              <RadioGroup
                name="willAnyonePayForVisit"
                options={["Yes", "No"]}
                value={visitData?.willAnyonePayForVisit}
                onChange={(value) =>
                  handleRadioChange("willAnyonePayForVisit", value)
                }
                errors={errors}
                disabled={disabled}
              />
            </div>
          </div>
        </QuestionCard>

        {/* Funding details - show only when Yes is selected */}
        {visitData?.willAnyonePayForVisit === "Yes" && (
          <>
            <QuestionCard
              icon={<Briefcase size={20} />}
              title="Name of the person/org who will fund"
            >
              <input
                type="text"
                name="fundingPersonName"
                value={visitData?.fundingPersonName || ""}
                onChange={handleInputChange}
                placeholder="Name of the person/org"
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#7350FF] focus:border-transparent"
              />
              {errors.fundingPersonName && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.fundingPersonName}
                </p>
              )}
            </QuestionCard>

            <QuestionCard
              icon={<Briefcase size={20} />}
              title="Your trip is funded by"
            >
              <RadioGroup
                name="tripFundedBy"
                options={[
                  "Employer",
                  "3rd Party",
                  "Mother",
                  "Father",
                  "Spouse",
                  "Sibling",
                  "Friend",
                  "Other",
                ]}
                value={visitData?.tripFundedBy}
                onChange={(value) => handleRadioChange("tripFundedBy", value)}
                errors={errors}
                disabled={disabled}
              />
            </QuestionCard>
          </>
        )}
      </div>

      <div className="mt-8 flex flex-col">
        {touchedSubmit && Object.keys(errors).length > 0 && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded text-red-700">
            Fill all the required points above
          </div>
        )}


      </div>
    </form>
  );
};

export default VisitDetailSection;
