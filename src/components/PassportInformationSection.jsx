import { useRef, useState, useEffect } from "react";
import {
  Upload,
  X,
  User,
  MapPin,
  CreditCard,
  CheckCircle,
  ChevronRight,
  Calendar,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function App({ passportData, setPassportData, handleSave }) {
  const [isComplete, setIsComplete] = useState(false);

  const onComplete = () => {
    setIsComplete(true);
    setTimeout(() => setIsComplete(false), 3000); // Reset for demonstration
  };

  return (
    <div className=" min-h-screen antialiased text-white">
      <div className="max-w-7xl mx-auto">
        
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

const PassportInformationSection = ({
  passportData,
  setPassportData,
  travelerIndex,
  onComplete,
  isComplete,
  handleSave,
  loading,
}) => {
  const [frontPreview, setFrontPreview] = useState(null);
  const [backPreview, setBackPreview] = useState(null);
  const frontInputRef = useRef(null);
  const backInputRef = useRef(null);
  const [errors, setErrors] = useState({});

  const [frontOcrLoading, setFrontOcrLoading] = useState(false);
  const [backOcrLoading, setBackOcrLoading] = useState(false);
  const [frontOcrError, setFrontOcrError] = useState(null);
  const [backOcrError, setBackOcrError] = useState(null);
  const [frontOcrSuccessMessage, setFrontOcrSuccessMessage] = useState("");
  const [backOcrSuccessMessage, setBackOcrSuccessMessage] = useState("");
  const [frontOcrDone, setFrontOcrDone] = useState(false);
  const [backOcrDone, setBackOcrDone] = useState(false);

  const [showUploadCard, setShowUploadCard] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [extractionStep, setExtractionStep] = useState("");
  const [showAutofillAnimation, setShowAutofillAnimation] = useState(false);

  const hasPassportImages =
    passportData.passportFront || passportData.passportBack;
  const hasBothImages = passportData.passportFront && passportData.passportBack;

  useEffect(() => {
    if (passportData.passportFront) {
      if (
        typeof passportData.passportFront === "string" &&
        passportData.passportFront.startsWith("data:")
      ) {
        setFrontPreview(passportData.passportFront);
      } else if (passportData.passportFront instanceof File) {
        const reader = new FileReader();
        reader.onloadend = () => setFrontPreview(reader.result);
        reader.readAsDataURL(passportData.passportFront);
      }
    } else {
      setFrontPreview(null);
    }

    if (passportData.passportBack) {
      if (
        typeof passportData.passportBack === "string" &&
        passportData.passportBack.startsWith("data:")
      ) {
        setBackPreview(passportData.passportBack);
      } else if (passportData.passportBack instanceof File) {
        const reader = new FileReader();
        reader.onloadend = () => setBackPreview(reader.result);
        reader.readAsDataURL(passportData.passportBack);
      }
    } else {
      setBackPreview(null);
    }

    if (hasBothImages && frontOcrDone && backOcrDone) {
      setShowUploadCard(false);
    }
  }, [
    passportData.passportFront,
    passportData.passportBack,
    travelerIndex,
    hasBothImages,
    frontOcrDone,
    backOcrDone,
  ]);

  useEffect(() => {
    if (frontInputRef.current) frontInputRef.current.value = "";
    if (backInputRef.current) backInputRef.current.value = "";
  }, [travelerIndex]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPassportData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const performOCR = async (file, side) => {
    if (side === "front") {
      setFrontOcrLoading(true);
      setFrontOcrError(null);
      setFrontOcrSuccessMessage("");
    } else {
      setBackOcrLoading(true);
      setBackOcrError(null);
      setBackOcrSuccessMessage("");
    }

    // Start autofill animation when processing begins
    setShowAutofillAnimation(true);
    setExtractionProgress(0);
    setExtractionStep("Processing document...");

    // Simulate progress updates
    const progressUpdates = [
      { progress: 20, step: "Analyzing document..." },
      { progress: 40, step: "Detecting text fields..." },
      { progress: 60, step: "Extracting information..." },
      { progress: 80, step: "Validating data..." },
      { progress: 100, step: "Complete!" },
    ];

    let progressIndex = 0;
    const progressInterval = setInterval(() => {
      if (progressIndex < progressUpdates.length) {
        setExtractionProgress(progressUpdates[progressIndex].progress);
        setExtractionStep(progressUpdates[progressIndex].step);
        progressIndex++;
      } else {
        clearInterval(progressInterval);
      }
    }, 800);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/extract-passport", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`OCR API error: ${response.status} ${text}`);
      }

      const data = await response.json();

      clearInterval(progressInterval);
      setExtractionProgress(100);
      setExtractionStep("Data extracted successfully!");

      const mapped = data.extractedFields || {};
      const simple = data.simpleFields || {};
      const rawFields =
        data.raw &&
        data.raw.rawHttp &&
        data.raw.rawHttp.inference &&
        data.raw.rawHttp.inference.result &&
        data.raw.rawHttp.inference.result.fields
          ? data.raw.rawHttp.inference.result.fields
          : null;

      const extracted = {
        passportNumber:
          mapped.passportNumber ||
          simple.passport_number ||
          (rawFields &&
            rawFields.passport_number &&
            rawFields.passport_number.value) ||
          null,
        firstName:
          mapped.firstName ||
          simple.given_names ||
          (rawFields && rawFields.given_names && rawFields.given_names.value) ||
          null,
        lastName:
          mapped.lastName ||
          simple.surnames ||
          (rawFields && rawFields.surnames && rawFields.surnames.value) ||
          null,
        dateOfBirth:
          mapped.dateOfBirth ||
          simple.date_of_birth ||
          (rawFields &&
            rawFields.date_of_birth &&
            rawFields.date_of_birth.value) ||
          null,
        sex:
          mapped.sex ||
          simple.sex ||
          (rawFields && rawFields.sex && rawFields.sex.value) ||
          null,
        passportIssueDate:
          mapped.passportIssueDate ||
          simple.date_of_issue ||
          (rawFields &&
            rawFields.date_of_issue &&
            rawFields.date_of_issue.value) ||
          null,
        passportExpiryDate:
          mapped.passportExpiryDate ||
          simple.date_of_expiry ||
          (rawFields &&
            rawFields.date_of_expiry &&
            rawFields.date_of_expiry.value) ||
          null,
        placeOfBirth:
          mapped.placeOfBirth ||
          simple.place_of_birth ||
          (rawFields &&
            rawFields.place_of_birth &&
            rawFields.place_of_birth.value) ||
          null,
        nationality:
          mapped.nationality ||
          simple.nationality ||
          (rawFields && rawFields.nationality && rawFields.nationality.value) ||
          null,
        mrz_line_1:
          (rawFields && rawFields.mrz_line_1 && rawFields.mrz_line_1.value) ||
          null,
        mrz_line_2:
          (rawFields && rawFields.mrz_line_2 && rawFields.mrz_line_2.value) ||
          null,
      };

      const foundFields = Object.values(extracted).filter(
        (v) => v != null
      ).length;

      if (foundFields > 0) {
        setPassportData((prev) => {
          const updates = {};

          const assignIfPresent = (key, value) => {
            if (value !== null && value !== undefined && value !== "") {
              updates[key] = value;
            }
          };

          assignIfPresent("passportNumber", extracted.passportNumber);
          assignIfPresent("firstName", extracted.firstName);
          assignIfPresent("lastName", extracted.lastName);
          assignIfPresent("dateOfBirth", extracted.dateOfBirth);
          assignIfPresent("sex", extracted.sex);
          assignIfPresent("passportIssueDate", extracted.passportIssueDate);
          assignIfPresent("passportExpiryDate", extracted.passportExpiryDate);
          assignIfPresent("placeOfBirth", extracted.placeOfBirth);
          assignIfPresent("nationality", extracted.nationality);

          // Map issuing country -> passportIssuePlace if present
          if (mapped && mapped.issuingCountry) {
            assignIfPresent("passportIssuePlace", mapped.issuingCountry);
          } else if (simple && simple.issuing_country) {
            assignIfPresent("passportIssuePlace", simple.issuing_country);
          } else if (
            rawFields &&
            rawFields.issuing_country &&
            rawFields.issuing_country.value
          ) {
            assignIfPresent(
              "passportIssuePlace",
              rawFields.issuing_country.value
            );
          }

          const finalUpdate = { ...prev, ...updates };
          // Preserve file refs and set the side file
          if (side === "front") {
            finalUpdate.passportFront = file;
          }
          if (side === "back") {
            finalUpdate.passportBack = file;
          }

          return finalUpdate;
        });

        const successMessage = `✅ Successfully extracted ${foundFields} field(s) from passport ${side} side.`;
        if (side === "front") {
          setFrontOcrSuccessMessage(successMessage);
          setFrontOcrError(null);
          setTimeout(() => setFrontOcrSuccessMessage(""), 8000);
          // mark front OCR as done
          setFrontOcrDone(true);
        } else {
          setBackOcrSuccessMessage(successMessage);
          setBackOcrError(null);
          setTimeout(() => setBackOcrSuccessMessage(""), 8000);
          // mark back OCR as done
          setBackOcrDone(true);
        }

        // Hide autofill animation after success
        setTimeout(() => {
          setShowAutofillAnimation(false);
          setExtractionProgress(0);
          setExtractionStep("");
        }, 2000);
      } else {
        const errorMessage = `No passport fields detected. Please try a clearer photo or enter details manually.`;
        if (side === "front") {
          setFrontOcrError(errorMessage);
          setFrontOcrSuccessMessage("");
        } else {
          setBackOcrError(errorMessage);
          setBackOcrSuccessMessage("");
        }
        setShowManualFallback(true);

        // mark OCR as done to avoid re-processing on refresh
        if (side === "front") setFrontOcrDone(true);
        else setBackOcrDone(true);

        // Hide autofill animation on no data
        setShowAutofillAnimation(false);
        setExtractionProgress(0);
        setExtractionStep("");
      }
    } catch (error) {
      console.error("Mindee API Error:", error);
      const errorMessage = `Failed to process the passport ${side} side. This could be due to image quality, network issues, or API limits. Please try again or enter details manually.`;

      clearInterval(progressInterval);

      if (side === "front") {
        setFrontOcrError(errorMessage);
        setFrontOcrDone(true);
      } else {
        setBackOcrError(errorMessage);
        setBackOcrDone(true);
      }
      setShowManualFallback(true);

      setShowAutofillAnimation(false);
      setExtractionProgress(0);
      setExtractionStep("");
    } finally {
      if (side === "front") {
        setFrontOcrLoading(false);
      } else {
        setBackOcrLoading(false);
      }
    }
  };

  const extractPassportDataFromMindee = (inference, side) => {
    const extractedData = {
      passportNumber: null,
      firstName: null,
      lastName: null,
      dateOfBirth: null,
      sex: null,
      expiryDate: null,
      issueDate: null,
      placeOfBirth: null,
      nationality: null,
      currentAddress: null,
      emergencyContact: null,
      foundFields: 0,
    };

    try {
      console.log("Processing Mindee inference:", inference);

      // Check if we have prediction data
      if (!inference || !inference.prediction) {
        console.log("No prediction data in inference");
        return extractedData;
      }

      const prediction = inference.prediction;

      // Extract passport number
      if (prediction.passport_number && prediction.passport_number.value) {
        extractedData.passportNumber = prediction.passport_number.value;
        extractedData.foundFields++;
        console.log("Found passport number:", extractedData.passportNumber);
      }

      // Extract names
      if (prediction.given_names && prediction.given_names.length > 0) {
        extractedData.firstName = prediction.given_names[0].value;
        extractedData.foundFields++;
        console.log("Found first name:", extractedData.firstName);
      }

      if (prediction.surname && prediction.surname.value) {
        extractedData.lastName = prediction.surname.value;
        extractedData.foundFields++;
        console.log("Found last name:", extractedData.lastName);
      }

      // Extract dates
      if (prediction.birth_date && prediction.birth_date.value) {
        // Convert from DD/MM/YYYY to YYYY-MM-DD format
        const dateParts = prediction.birth_date.value.split("/");
        if (dateParts.length === 3) {
          const day = dateParts[0].padStart(2, "0");
          const month = dateParts[1].padStart(2, "0");
          const year = dateParts[2];
          extractedData.dateOfBirth = `${year}-${month}-${day}`;
          extractedData.foundFields++;
          console.log("Found date of birth:", extractedData.dateOfBirth);
        }
      }

      if (prediction.expiry_date && prediction.expiry_date.value) {
        // Convert from DD/MM/YYYY to YYYY-MM-DD format
        const dateParts = prediction.expiry_date.value.split("/");
        if (dateParts.length === 3) {
          const day = dateParts[0].padStart(2, "0");
          const month = dateParts[1].padStart(2, "0");
          const year = dateParts[2];
          extractedData.expiryDate = `${year}-${month}-${day}`;
          extractedData.foundFields++;
          console.log("Found expiry date:", extractedData.expiryDate);
        }
      }

      if (prediction.issuance_date && prediction.issuance_date.value) {
        // Convert from DD/MM/YYYY to YYYY-MM-DD format
        const dateParts = prediction.issuance_date.value.split("/");
        if (dateParts.length === 3) {
          const day = dateParts[0].padStart(2, "0");
          const month = dateParts[1].padStart(2, "0");
          const year = dateParts[2];
          extractedData.issueDate = `${year}-${month}-${day}`;
          extractedData.foundFields++;
          console.log("Found issue date:", extractedData.issueDate);
        }
      }

      // Extract gender
      if (prediction.gender && prediction.gender.value) {
        const gender = prediction.gender.value.toLowerCase();
        if (gender === "m" || gender === "male") {
          extractedData.sex = "Male";
          extractedData.foundFields++;
        } else if (gender === "f" || gender === "female") {
          extractedData.sex = "Female";
          extractedData.foundFields++;
        }
        console.log("Found gender:", extractedData.sex);
      }

      // Extract nationality
      if (prediction.nationality && prediction.nationality.value) {
        extractedData.nationality = prediction.nationality.value;
        extractedData.foundFields++;
        console.log("Found nationality:", extractedData.nationality);
      }

      // Extract place of birth
      if (prediction.birth_place && prediction.birth_place.value) {
        extractedData.placeOfBirth = prediction.birth_place.value;
        extractedData.foundFields++;
        console.log("Found place of birth:", extractedData.placeOfBirth);
      }

      // For back side specific fields (if available in the model)
      if (side === "back") {
        // These fields might be available depending on the custom model
        if (prediction.address && prediction.address.value) {
          extractedData.currentAddress = prediction.address.value;
          extractedData.foundFields++;
          console.log("Found address:", extractedData.currentAddress);
        }

        if (
          prediction.emergency_contact &&
          prediction.emergency_contact.value
        ) {
          extractedData.emergencyContact = prediction.emergency_contact.value;
          extractedData.foundFields++;
          console.log(
            "Found emergency contact:",
            extractedData.emergencyContact
          );
        }
      }
    } catch (error) {
      console.error("Error extracting data from Mindee inference:", error);
    }

    console.log(
      `Extracted ${extractedData.foundFields} fields from ${side} side:`,
      extractedData
    );
    return extractedData;
  };


  

  const handleFileUpload = (e, side) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        [side === "front" ? "passportFront" : "passportBack"]:
          "File size must be less than 5MB.",
      }));
      return;
    }

    setErrors((prev) => ({
      ...prev,
      [side === "front" ? "passportFront" : "passportBack"]: "",
    }));

    const reader = new FileReader();
    reader.onloadend = () => {
      if (side === "front") {
        setFrontPreview(reader.result);

        setPassportData((prev) => {
          const newData = {
            ...prev,
            passportFront: file,
          };
          return newData;
        });
        setErrors((prev) => ({
          ...prev,
          passportFront: "",
        }));
        setFrontOcrDone(false);
        performOCR(file, "front");
      } else {
        setBackPreview(reader.result);

        setPassportData((prev) => {
          const newData = {
            ...prev,
            passportBack: file,
          };
          return newData;
        });
        setErrors((prev) => ({
          ...prev,
          passportBack: "",
        }));
        performOCR(file, "back");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (side) => {
    if (side === "front") {
      setFrontPreview(null);
      setPassportData((prev) => ({
        ...prev,
        passportFront: null,
      }));
      if (frontInputRef.current) frontInputRef.current.value = "";
      setFrontOcrDone(false);
    } else {
      setBackPreview(null);
      setPassportData((prev) => ({
        ...prev,
        passportBack: null,
      }));
      if (backInputRef.current) backInputRef.current.value = "";
      setBackOcrDone(false);
    }
  };

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
      city,
      pincode,
      mobileNumber,
      passportFront,
      passportBack,
    } = passportData;

    if (!passportNumber)
      newErrors.passportNumber = "Passport number is required.";
    if (!firstName) newErrors.firstName = "First name is required.";
    if (!lastName) newErrors.lastName = "Last name is required.";
    if (!sex) newErrors.sex = "Sex is required.";
    if (!dateOfBirth) newErrors.dateOfBirth = "Date of birth is required.";
    else if (new Date(dateOfBirth) > new Date())
      newErrors.dateOfBirth = "Date of birth cannot be in the future.";
    if (!placeOfBirth) newErrors.placeOfBirth = "Place of birth is required.";

    if (!mobileNumber) {
      newErrors.mobileNumber = "Mobile number is required.";
    } else {
      const s = String(mobileNumber).trim();
      const digits = s.replace(/[\s()\-]/g, "");
      const ukPhoneRegex = /^(?:\+447\d{9}|447\d{9}|07\d{9})$/;
      if (!ukPhoneRegex.test(digits)) {
        newErrors.mobileNumber = "Please enter a valid UK mobile number (e.g. +447123456789 or 07123456789).";
      }
    }

    if (!passportIssuePlace)
      newErrors.passportIssuePlace = "Passport issue place is required.";
    if (!passportIssueDate)
      newErrors.passportIssueDate = "Passport issue date is required.";
    if (!passportExpiryDate)
      newErrors.passportExpiryDate = "Passport expiry date is required.";
    else if (new Date(passportExpiryDate) < new Date(passportIssueDate))
      newErrors.passportExpiryDate = "Expiry date must be after issue date.";

    if (!currentAddress1)
      newErrors.currentAddress1 = "Address Line 1 is required.";
    if (!city) newErrors.city = "City is required.";
    if (!pincode) newErrors.pincode = "Postcode is required.";
    else {
      const ukPostcodeRegex = /^([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}|GIR\s?0AA)$/i;
      if (!ukPostcodeRegex.test(String(pincode).trim())) {
        newErrors.pincode = "Please enter a valid UK postcode.";
      }
    }

    if (!passportData.travelStartDate)
      newErrors.travelStartDate = "Travel start date is required.";
    if (!passportData.travelEndDate)
      newErrors.travelEndDate = "Travel end date is required.";

    if (passportData.travelStartDate && passportData.travelEndDate) {
      const startDate = new Date(passportData.travelStartDate);
      const endDate = new Date(passportData.travelEndDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (startDate < today) {
        newErrors.travelStartDate = "Travel start date cannot be in the past.";
      }
      if (endDate <= startDate) {
        newErrors.travelEndDate = "Travel end date must be after start date.";
      }

      const diffTime = Math.abs(endDate - startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 365) {
        newErrors.travelEndDate = "Trip duration cannot exceed 365 days.";
      }
    }

    if (!passportFront && !frontPreview) {
      newErrors.passportFront = "Passport front page is required.";
    }
    if (!passportBack && !backPreview) {
      newErrors.passportBack = "Passport back page is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      if (handleSave) {
        handleSave();
      } else {
        onComplete();
      }
    } 
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className=" rounded-xl p-6 border border-[#423577] shadow-sm"
      >
        <h2 className="flex items-center text-xl font-semibold mb-6 text-white">
          <Calendar className="text-white mr-3" size={24} />
          1. Add your tentative travel dates
        </h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            These dates can be approximate and are only required to get you a
            visa. You may make changes later as per visa issuance period.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Tentative departure date
            </label>
            <div className="relative">
              <input
                type="date"
                name="travelStartDate"
                value={passportData.travelStartDate || ""}
                onChange={handleInputChange}
                min={new Date().toISOString().split("T")[0]}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition outline-none bg-[#292933] text-white [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer ${
                  errors.travelStartDate ? "border-red-500" : "border-[#423577]"
                }`}
                style={{
                  colorScheme: "light",
                }}
              />
            </div>
            {errors.travelStartDate && (
              <p className="text-red-400 text-xs mt-1">
                {errors.travelStartDate}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Tentative return date
            </label>
            <div className="relative">
              <input
                type="date"
                name="travelEndDate"
                value={passportData.travelEndDate || ""}
                onChange={handleInputChange}
                min={
                  passportData.travelStartDate ||
                  new Date().toISOString().split("T")[0]
                }
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition outline-none bg-[#292933] text-white [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer ${
                  errors.travelEndDate ? "border-red-500" : "border-[#423577]"
                }`}
                style={{
                  colorScheme: "light",
                }}
              />
            </div>
            {errors.travelEndDate && (
              <p className="text-red-400 text-xs mt-1">
                {errors.travelEndDate}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      <div className="flex flex-col md:flex-row gap-10">
        {/* Passport Upload Section (Left Side) */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full md:w-1/2"
        >
          <div className=" rounded-xl p-6 border border-[#423577] shadow-sm">
            <h3 className="flex items-center text-lg font-semibold mb-4 text-white">
              <Upload className="text-[#7350FF] mr-2" size={20} />
              2. Upload passport
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
                  Upload a clear photo of the front page (JPG, PNG or PDF) -
                  Data will be auto-extracted
                </p>

                {/* OCR Status Messages for Front Side */}
                {frontOcrLoading && (
                  <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center text-blue-800">
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      <span className="text-sm font-medium">
                        Processing passport front side...
                      </span>
                    </div>
                  </div>
                )}

                {/* front OCR success/error messages removed - using shared UI */}

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
                  Upload a clear photo of the back page (JPG, PNG or PDF) -
                  Additional data may be extracted
                </p>

                {/* OCR Status Messages for Back Side */}
                {backOcrLoading && (
                  <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center text-blue-800">
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      <span className="text-sm font-medium">
                        Processing passport back side...
                      </span>
                    </div>
                  </div>
                )}

                {/* back OCR success/error messages removed - using shared UI */}

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
          </div>
        </motion.div>

        {/* Form Section (Right Side) */}
        <div className="w-full md:w-1/2 space-y-6 relative">
          {/* Blur overlay when no passport uploaded */}
          {!hasPassportImages && !showAutofillAnimation && (
            <div className="absolute inset-0 backdrop-blur-sm rounded-xl z-10 flex items-center justify-center">
              <div className="text-center p-8">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Autofill basic details
                </h3>
                <div className="h-2"></div>
                <p className="text-gray-300 text-sm">
                  Upload passport to autofill your basic details and start your
                  application
                </p>
              </div>
            </div>
          )}

          {/* OCR Processing Animation */}
          {
            showAutofillAnimation
             && (
              <div className="absolute inset-0 backdrop-blur-sm rounded-xl z-10 flex items-center justify-center">
                <div className="flex flex-col items-center text-center p-8 space-y-4">
                  <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center relative">
                    <Sparkles className="w-8 h-8 text-white animate-pulse" />
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Extracting Information
                    </h3>
                    <p className="text-gray-300 text-sm mb-4">
                      {extractionStep}
                    </p>

                    {/* Progress Bar */}
                    <div className="w-64 h-2 bg-gray-700 rounded-full mx-auto overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${extractionProgress}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                      />
                    </div>

                    <div className="mt-2 text-sm text-gray-400">
                      {extractionProgress}% complete
                    </div>
                  </div>
                </div>
              </div>
            )
          }

          {/* Form Content */}
          <div className="rounded-xl p-6 border border-[#423577] shadow-sm">
            <h3 className="text-lg font-semibold mb-6 text-white">
              Review {passportData.firstName || "YOUR"}{" "}
              {passportData.lastName || "NAME"}'s basic details:
            </h3>
            {/* Personal Information Section */}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              // className="bg-[#23232B] rounded-xl shadow-sm p-6 border border-[#423577]"
            >
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
                <div className="col-span-2">
                  <label className="block text-sm font-medium  mb-1 ">
                    Name (as on Passport)
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={passportData.firstName}
                    onChange={handleInputChange}
                    placeholder="Name"
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
                <div className="col-span-2">
                  <label className="block text-sm font-medium  mb-1">
                    SurName
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={passportData.lastName}
                    onChange={handleInputChange}
                    placeholder="SurName"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition outline-none ${
                      errors.lastName ? "border-red-500" : "border-[#423577]"
                    }`}
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.lastName}
                    </p>
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
                <div className="relative">
                  <label className="block text-sm font-medium  mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={passportData.dateOfBirth}
                    onChange={handleInputChange}
                    className={`w-full px-4  py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition outline-none [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer ${
                      errors.dateOfBirth ? "border-red-500" : "border-[#423577]"
                    }`}
                    style={{
                      colorScheme: "light",
                    }}
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
                      errors.placeOfBirth
                        ? "border-red-500"
                        : "border-[#423577]"
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
                <div className="relative">
                  <label className="block text-sm font-medium  mb-1">
                    Passport Issue Date
                  </label>
                  <input
                    type="date"
                    name="passportIssueDate"
                    value={passportData.passportIssueDate}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition outline-none [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer ${
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
                <div className="relative">
                  <label className="block text-sm font-medium  mb-1">
                    Passport Expiry Date
                  </label>
                  <input
                    type="date"
                    name="passportExpiryDate"
                    value={passportData.passportExpiryDate}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition outline-none [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer ${
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
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-sm font-medium  mb-1">
                    Current Address Line 1
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
                    Current Address Line 2
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
                {/* State removed for UK addresses - kept intentionally blank */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium  mb-1">
                      City
                    </label>
                    <input
                      list="city-options"
                      type="text"
                      name="city"
                      value={passportData.city}
                      onChange={handleInputChange}
                      placeholder="City (type or select)"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition outline-none ${
                        errors.city ? "border-red-500" : "border-[#423577]"
                      }`}
                    />
                    <datalist id="city-options">
                      <option value="London" />
                      <option value="Manchester" />
                      <option value="Birmingham" />
                      <option value="Edinburgh" />
                    </datalist>
                    {errors.city && (
                      <p className="text-red-500 text-xs mt-1">{errors.city}</p>
                    )}
                  </div>
                  <div>
                      <label className="block text-sm font-medium  mb-1">
                        Postcode
                      </label>
                      <input
                        type="text"
                        name="pincode"
                        value={passportData.pincode}
                        onChange={handleInputChange}
                        placeholder="e.g. SW1A 1AA"
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
                <div className="flex flex-col gap-1">
                  <label className="block text-sm font-medium col-span-2">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    name="mobileNumber"
                    value={passportData.mobileNumber || ""}
                    onChange={handleInputChange}
                    placeholder="e.g. +447123456789 or 07123456789"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition outline-none ${
                      errors.mobileNumber
                        ? "border-red-500"
                        : "border-[#423577]"
                    }`}
                  />
                  {errors.mobileNumber && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.mobileNumber}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="flex justify-end max-w-7xl">
        <button
          type="submit"
          disabled={isProcessing || loading}
          className="bg-[#7350FF] hover:bg-[#6346E5] disabled:bg-[#7350FF]/30 disabled:cursor-not-allowed text-white font-medium px-6 py-3 rounded-lg transition-all duration-200 flex items-center gap-2 shadow-lg"
        >
          {(isProcessing || loading) && (
            <Loader2 className="w-4 h-4 animate-spin" />
          )}
          {isProcessing || loading ? "Saving..." : "Save and Continue"}

        </button>
      </div>
    </form>
  );
};
