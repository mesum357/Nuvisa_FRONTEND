import { useRef, useState, useEffect } from "react";
import {
  Upload,
  X,
  User,
  MapPin,
  CreditCard,
  CheckCircle,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";

// The full application component including the form, state management, and all sections.
export default function App({ passportData, setPassportData, handleSave }) {
  const [isComplete, setIsComplete] = useState(false);

  // onComplete function to simulate a successful form submission
  const onComplete = () => {
    setIsComplete(true);
    setTimeout(() => setIsComplete(false), 3000); // Reset for demonstration
  };

  return (
    <div className=" min-h-screen antialiased text-white">
      <div className="max-w-7xl mx-auto">
        {/* <div className="flex items-center justify-between p-4 mb-4 bg-[#23232B] rounded-xl shadow-sm border border-[#423577]">
          <h2 className="text-xl font-semibold flex items-center">
            <User className="text-[#7350FF] mr-2" size={24} />
            Passport Information
            {isComplete && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="ml-3 text-green-500"
              >
                <CheckCircle size={24} />
              </motion.span>
            )}
          </h2>
          <motion.div
            className={`flex items-center transition-opacity ${
              isComplete ? "opacity-100" : "opacity-0"
            }`}
          >
            <span className="text-sm font-medium text-green-600 mr-2">
              Successfully Submitted!
            </span>
            <ChevronRight className="text-gray-400" />
          </motion.div>
        </div> */}
        <PassportInformationSection
          passportData={passportData}
          setPassportData={setPassportData}
          onComplete={onComplete}
          isComplete={isComplete}
          handleSave={handleSave}
        />
      </div>
    </div>
  );
}

// The main form component with validation logic
const PassportInformationSection = ({
  passportData,
  setPassportData,
  travelerIndex,
  onComplete,
  isComplete,
  handleSave,
}) => {
  const [frontPreview, setFrontPreview] = useState(null);
  const [backPreview, setBackPreview] = useState(null);
  const frontInputRef = useRef(null);
  const backInputRef = useRef(null);
  const [errors, setErrors] = useState({});

  // useEffect to handle loading base64 images from saved data and reset when switching travelers
  useEffect(() => {
    // console.log(
    //   "PassportInformationSection useEffect triggered for traveler",
    //   travelerIndex
    // );
    // console.log("passportData.passportFront:", passportData.passportFront);
    // console.log("passportData.passportBack:", passportData.passportBack);

    // Reset previews first
    setFrontPreview(null);
    setBackPreview(null);

    // Handle front image
    if (passportData.passportFront) {
      if (
        typeof passportData.passportFront === "string" &&
        passportData.passportFront.startsWith("data:")
      ) {
        // Base64 string from saved data
        // console.log(
        //   "setting front preview from base64 for traveler",
        //   travelerIndex
        // );
        setFrontPreview(passportData.passportFront);
      } else if (passportData.passportFront instanceof File) {
        // File object - convert to preview
        // console.log(
        //   "setting front preview from File object for traveler",
        //   travelerIndex
        // );
        const reader = new FileReader();
        reader.onloadend = () => setFrontPreview(reader.result);
        reader.readAsDataURL(passportData.passportFront);
      }
    }

    // Handle back image
    if (passportData.passportBack) {
      if (
        typeof passportData.passportBack === "string" &&
        passportData.passportBack.startsWith("data:")
      ) {
        // Base64 string from saved data
        // console.log(
        //   "setting back preview from base64 for traveler",
        //   travelerIndex
        // );
        setBackPreview(passportData.passportBack);
      } else if (passportData.passportBack instanceof File) {
        // File object - convert to preview
        // console.log(
        //   "setting back preview from File object for traveler",
        //   travelerIndex
        // );
        const reader = new FileReader();
        reader.onloadend = () => setBackPreview(reader.result);
        reader.readAsDataURL(passportData.passportBack);
      }
    }
  }, [passportData.passportFront, passportData.passportBack, travelerIndex]);

  // Separate useEffect to clear file inputs only when traveler changes
  useEffect(() => {
    // Clear file inputs when traveler changes
    if (frontInputRef.current) frontInputRef.current.value = "";
    if (backInputRef.current) backInputRef.current.value = "";
  }, [travelerIndex]);

  // Handles changes to text/select inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPassportData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear the error for the changed field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Handles file uploads and sets the preview state
  const handleFileUpload = (e, side) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (MAX. 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        [side === "front" ? "passportFront" : "passportBack"]:
          "File size must be less than 5MB.",
      }));
      return;
    }

    // Clear previous error
    setErrors((prev) => ({
      ...prev,
      [side === "front" ? "passportFront" : "passportBack"]: "",
    }));

    const reader = new FileReader();
    reader.onloadend = () => {
      if (side === "front") {
        setFrontPreview(reader.result);
        setPassportData((prev) => ({
          ...prev,
          passportFront: file,
        }));
      } else {
        setBackPreview(reader.result);
        setPassportData((prev) => ({
          ...prev,
          passportBack: file,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Handles removing uploaded images and clearing the state
  const handleRemoveImage = (side) => {
    if (side === "front") {
      setFrontPreview(null);
      setPassportData((prev) => ({
        ...prev,
        passportFront: null,
      }));
      if (frontInputRef.current) frontInputRef.current.value = "";
    } else {
      setBackPreview(null);
      setPassportData((prev) => ({
        ...prev,
        passportBack: null,
      }));
      if (backInputRef.current) backInputRef.current.value = "";
    }
  };

  // Validation logic
  const validate = () => {
    const newErrors = {};
    const {
      passportNumber,
      firstName,
      lastName,
      sex,
      dateOfBirth,
      placeOfBirth,
      passportIssuePlace,
      passportIssueDate,
      passportExpiryDate,
      currentAddress1,
      state,
      city,
      pincode,
      passportFront,
      passportBack,
    } = passportData;

    // Personal Information Validation
    if (!passportNumber)
      newErrors.passportNumber = "Passport number is required.";
    if (!firstName) newErrors.firstName = "First name is required.";
    if (!lastName) newErrors.lastName = "Last name is required.";
    if (!sex) newErrors.sex = "Sex is required.";
    if (!dateOfBirth) newErrors.dateOfBirth = "Date of birth is required.";
    else if (new Date(dateOfBirth) > new Date())
      newErrors.dateOfBirth = "Date of birth cannot be in the future.";
    if (!placeOfBirth) newErrors.placeOfBirth = "Place of birth is required.";

    // Passport Details Validation
    if (!passportIssuePlace)
      newErrors.passportIssuePlace = "Passport issue place is required.";
    if (!passportIssueDate)
      newErrors.passportIssueDate = "Passport issue date is required.";
    if (!passportExpiryDate)
      newErrors.passportExpiryDate = "Passport expiry date is required.";
    else if (new Date(passportExpiryDate) < new Date(passportIssueDate))
      newErrors.passportExpiryDate = "Expiry date must be after issue date.";

    // Current Address Validation
    if (!currentAddress1)
      newErrors.currentAddress1 = "Address Line 1 is required.";
    if (!state) newErrors.state = "State is required.";
    if (!city) newErrors.city = "City is required.";
    if (!pincode) newErrors.pincode = "Pincode is required.";
    else if (!/^\d{6}$/.test(pincode))
      newErrors.pincode = "Pincode must be a 6-digit number.";

    // Passport Upload Validation
    if (!passportFront)
      newErrors.passportFront = "Passport front page is required.";
    if (!passportBack)
      newErrors.passportBack = "Passport back page is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handles form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      // Form is valid, call the handleSave handler from parent
      if (handleSave) {
        handleSave();
      } else {
        onComplete();
      }
      console.log("Form submitted successfully!", passportData);
    } else {
      console.log("Form has validation errors.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col md:flex-row gap-10">
        {/* Passport Upload Section (Left Side) */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className=" w-full md:w-1/2"
        >
          <h3 className="flex items-center text-lg font-semibold mb-4">
            <Upload className="text-[#7350FF] mr-2" size={20} />
            Passport Upload
          </h3>
          <div className="space-y-6">
            {/* Front Side Upload */}
            <div
              className={`border-2 border-dashed rounded-xl p-4 transition ${
                errors.passportFront
                  ? "border-red-500 bg-red-50"
                  : "border-[#423577] hover:border-purple-400"
              }`}
            >
              <label className="block text-sm font-medium  mb-2">
                Passport Front Page
              </label>
              <p className="text-xs text-gray-400 mb-3">
                Upload a clear photo of the front page (JPG, PNG or PDF)
              </p>
              {frontPreview ? (
                <div className="mb-3 relative group">
                  <img
                    src={frontPreview}
                    alt="Passport Front Preview"
                    className="max-h-48 w-full object-contain mx-auto border rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage("front")}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-[#423577] border-dashed rounded-lg cursor-pointer transition">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-10 h-10 mb-3 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-400">
                        <span className="font-semibold">Click to upload</span>{" "}
                        or drag and drop
                      </p>
                      <p className="text-xs text-gray-400">
                        JPG, PNG or PDF (MAX. 5MB)
                      </p>
                    </div>
                    <input
                      id="passport-front"
                      type="file"
                      ref={frontInputRef}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload(e, "front")}
                    />
                  </label>
                </div>
              )}
              {errors.passportFront && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.passportFront}
                </p>
              )}
            </div>
            {/* Back Side Upload */}
            <div
              className={`border-2 border-dashed rounded-xl p-4 transition ${
                errors.passportBack
                  ? "border-red-500 bg-red-50"
                  : "border-[#423577] hover:border-purple-400"
              }`}
            >
              <label className="block text-sm font-medium  mb-2">
                Passport Back Page
              </label>
              <p className="text-xs text-gray-400 mb-3">
                Upload a clear photo of the back page (JPG, PNG or PDF)
              </p>
              {backPreview ? (
                <div className="mb-3 relative group">
                  <img
                    src={backPreview}
                    alt="Passport Back Preview"
                    className="max-h-48 w-full object-contain mx-auto border rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage("back")}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-[#423577] border-dashed rounded-lg cursor-pointer transition">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-10 h-10 mb-3 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-400">
                        <span className="font-semibold">Click to upload</span>{" "}
                        or drag and drop
                      </p>
                      <p className="text-xs text-gray-400">
                        JPG, PNG or PDF (MAX. 5MB)
                      </p>
                    </div>
                    <input
                      id="passport-back"
                      type="file"
                      ref={backInputRef}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload(e, "back")}
                    />
                  </label>
                </div>
              )}
              {errors.passportBack && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.passportBack}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Other Sections (Right Side) */}
        <div className="w-full md:w-1/2 space-y-6">
          {/* Personal Information Section */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            // className="bg-[#23232B] rounded-xl shadow-sm p-6 border border-[#423577]"
          >
            <h3 className="flex items-center text-lg font-semibold mb-5">
              {/* <User className="text-[#7350FF] mr-2" size={20} /> */}
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium  mb-1">
                  Passport Number
                </label>
                <input
                  type="text"
                  name="passportNumber"
                  value={passportData.passportNumber}
                  onChange={handleInputChange}
                  placeholder="Enter passport number"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition outline-none ${
                    errors.passportNumber
                      ? "border-red-500"
                      : "border-[#423577]"
                  }`}
                />
                {errors.passportNumber && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.passportNumber}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium  mb-1">
                  First Name (as on Passport)
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={passportData.firstName}
                  onChange={handleInputChange}
                  placeholder="First name"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition outline-none ${
                    errors.firstName ? "border-red-500" : "border-[#423577]"
                  }`}
                />
                {errors.firstName && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.firstName}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium  mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={passportData.lastName}
                  onChange={handleInputChange}
                  placeholder="Last name"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition outline-none ${
                    errors.lastName ? "border-red-500" : "border-[#423577]"
                  }`}
                />
                {errors.lastName && (
                  <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium  mb-1">Sex</label>
                <select
                  name="sex"
                  value={passportData.sex}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition outline-none ${
                    errors.sex ? "border-red-500" : "border-[#423577]"
                  }`}
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.sex && (
                  <p className="text-red-500 text-xs mt-1">{errors.sex}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium  mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={passportData.dateOfBirth}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition outline-none ${
                    errors.dateOfBirth ? "border-red-500" : "border-[#423577]"
                  }`}
                />
                {errors.dateOfBirth && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.dateOfBirth}
                  </p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium  mb-1">
                  Place of Birth
                </label>
                <input
                  type="text"
                  name="placeOfBirth"
                  value={passportData.placeOfBirth}
                  onChange={handleInputChange}
                  placeholder="City, Country"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition outline-none ${
                    errors.placeOfBirth ? "border-red-500" : "border-[#423577]"
                  }`}
                />
                {errors.placeOfBirth && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.placeOfBirth}
                  </p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Passport Details Section */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            // className="bg-[#23232B] rounded-xl shadow-sm p-6 border border-[#423577]"
          >
            <h3 className="flex items-center text-lg font-semibold mb-4">
              <CreditCard className="text-[#7350FF] mr-2" size={20} />
              Passport Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium  mb-1">
                  Passport Issue Place
                </label>
                <input
                  type="text"
                  name="passportIssuePlace"
                  value={passportData.passportIssuePlace}
                  onChange={handleInputChange}
                  placeholder="City, Country"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition outline-none ${
                    errors.passportIssuePlace
                      ? "border-red-500"
                      : "border-[#423577]"
                  }`}
                />
                {errors.passportIssuePlace && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.passportIssuePlace}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium  mb-1">
                  Passport Issue Date
                </label>
                <input
                  type="date"
                  name="passportIssueDate"
                  value={passportData.passportIssueDate}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition outline-none ${
                    errors.passportIssueDate
                      ? "border-red-500"
                      : "border-[#423577]"
                  }`}
                />
                {errors.passportIssueDate && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.passportIssueDate}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium  mb-1">
                  Passport Expiry Date
                </label>
                <input
                  type="date"
                  name="passportExpiryDate"
                  value={passportData.passportExpiryDate}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition outline-none ${
                    errors.passportExpiryDate
                      ? "border-red-500"
                      : "border-[#423577]"
                  }`}
                />
                {errors.passportExpiryDate && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.passportExpiryDate}
                  </p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Current Address Section */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            // className="bg-[#23232B] rounded-xl shadow-sm p-6 border border-[#423577]"
          >
            <h3 className="flex items-center text-lg font-semibold mb-4">
              <MapPin className="text-[#7350FF] mr-2" size={20} />
              Current Address
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium  mb-1">
                  Address Line 1
                </label>
                <input
                  type="text"
                  name="currentAddress1"
                  value={passportData.currentAddress1}
                  onChange={handleInputChange}
                  placeholder="Street address, P.O. box"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition outline-none ${
                    errors.currentAddress1
                      ? "border-red-500"
                      : "border-[#423577]"
                  }`}
                />
                {errors.currentAddress1 && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.currentAddress1}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium  mb-1">
                  Address Line 2
                </label>
                <input
                  type="text"
                  name="currentAddress2"
                  value={passportData.currentAddress2}
                  onChange={handleInputChange}
                  placeholder="Apartment, suite, unit, building, floor"
                  className="w-full px-4 py-2 border border-[#423577] rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition outline-none"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium  mb-1">
                    State
                  </label>
                  <select
                    name="state"
                    value={passportData.state}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition outline-none ${
                      errors.state ? "border-red-500" : "border-[#423577]"
                    }`}
                  >
                    <option value="">Select state</option>
                    <option value="California">California</option>
                    <option value="New York">New York</option>
                    <option value="Texas">Texas</option>
                  </select>
                  {errors.state && (
                    <p className="text-red-500 text-xs mt-1">{errors.state}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium  mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={passportData.city}
                    onChange={handleInputChange}
                    placeholder="City"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition outline-none ${
                      errors.city ? "border-red-500" : "border-[#423577]"
                    }`}
                  />
                  {errors.city && (
                    <p className="text-red-500 text-xs mt-1">{errors.city}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium  mb-1">
                    ZIP/Pincode
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={passportData.pincode}
                    onChange={handleInputChange}
                    placeholder="Postal code"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition outline-none ${
                      errors.pincode ? "border-red-500" : "border-[#423577]"
                    }`}
                  />
                  {errors.pincode && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.pincode}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex max-w-7xl">
        <button
          type="submit"
          className="mt-4 bg-[#7350FF] text-white px-4 py-2 rounded hover:bg-[#7350FF] disabled:bg-[#7350FF]/30"
        >
          Submit
        </button>
      </div>
    </form>
  );
};
