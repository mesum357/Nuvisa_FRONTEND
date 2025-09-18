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

  // useEffect to handle loading saved images only when switching travelers
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

    // Hide upload card when both images are uploaded and processed
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

  // OCR processing function
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
      // Create FormData to send file to API
      const formData = new FormData();
      formData.append("file", file);

      // Send to Mindee API route
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

      // The backend returns { raw, extractedFields, simpleFields }.
      // Prefer `extractedFields` (already mapped), fall back to `simpleFields` (flat raw values),
      // and finally try to read values from `raw.rawHttp.inference.result.fields`.
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

      // Hide autofill animation on error
      setShowAutofillAnimation(false);
      setExtractionProgress(0);
      setExtractionStep("");
    } finally {
      // Clear loading states based on side
      if (side === "front") {
        setFrontOcrLoading(false);
      } else {
        setBackOcrLoading(false);
      }
    }
  };

  // Function to extract passport data from Mindee inference
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

  // Function to extract passport data from OCR text
  const extractPassportData = (text, side = "front") => {
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
      foundFields: 0,
    };

    console.log("Processing OCR text:", text);

    // Split text into lines for better parsing
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    const normalizedText = text.replace(/\n/g, " ").replace(/\s+/g, " ").trim();

    // Enhanced Passport Number patterns for Indian and UK passports
    const passportPatterns = [
      // Indian format (L8765432, J8369854)
      /\b([A-Z]\d{7,8})\b/g,
      // UK format (987654321)
      /\b(\d{9})\b/g,
      // With passport label
      /(?:Passport\s*(?:No|Number|Code)\.?\s*[:\-]?\s*)([A-Z]?\d{7,9})/i,
      /(?:Code\s*[:\-]?\s*)([A-Z]?\d{7,9})/i,
      // MRZ format - extract from MRZ line
      /P<[A-Z]{3}([A-Z\d]{1,9})</,
      // General alphanumeric passport format
      /\b([A-Z]{1,2}\d{6,9})\b/g,
    ];

    for (const pattern of passportPatterns) {
      const matches = normalizedText.match(pattern);
      if (matches) {
        // Filter out obvious non-passport numbers
        for (const match of matches) {
          const passportNum = typeof match === "string" ? match : match[1];
          if (
            passportNum &&
            passportNum.length >= 7 &&
            passportNum.length <= 9
          ) {
            extractedData.passportNumber = passportNum.replace(/\s/g, "");
            extractedData.foundFields++;
            break;
          }
        }
        if (extractedData.passportNumber) break;
      }
    }

    // Enhanced Name extraction for Indian and UK passports
    // Look for Surname first
    const surnamePatterns = [
      /(?:Surname\s*[:\-]?\s*)([A-Z][A-Z\s]{2,30})/i,
      /(?:Sumame\s*[:\-]?\s*)([A-Z][A-Z\s]{2,30})/i, // Handle OCR typo
      // Line-based detection - often surname appears after passport number
      /[A-Z]?\d{7,9}\s+[A-Z]*\s*([A-Z]{4,25})\s*(?:To|Given|ven|[A-Z]{2,})/i,
      // Look for pattern - single word in caps after passport details
      /\b([A-Z]{4,25})\b(?=\s*(?:To|Given|ven|[A-Z]{2,}|\n))/,
      // Direct line match for names like KUMAR, RAMADUGULA
      /^([A-Z]{4,25})$/m,
    ];

    // Look for Given Names
    const givenNamePatterns = [
      /(?:Given\s*Names?\s*[:\-]?\s*)([A-Z][A-Z\s]{2,40})/i,
      /(?:ven\s*Names?\s*[:\-]?\s*)([A-Z][A-Z\s]{2,40})/i, // Handle OCR typo "ven" instead of "Given"
      // Multiple word given names like "ANJALI RAJESH" or "DAVID ROBERT"
      /(?:Given\s*Names?\s*[:\-]?\s*)([A-Z\s]{2,40})(?:\s*[A-Z]*\s*[MF]\s|\s*INDIAN|\s*BRITISH|\n|$)/i,
      /(?:ven\s*Names?\s*[:\-]?\s*)([A-Z\s]{2,40})(?:\s*[A-Z]*\s*[MF]\s|\s*INDIAN|\s*BRITISH|\n|$)/i,
      // Pattern after "To" or similar - handles "To vn ow Given Name(s) SITA MAHA LAKSHNI"
      /(?:To|Given|ven)[\s\w]*\s+([A-Z][A-Z\s]{2,40})(?=\s*[A-Z]*\s*[MF]\s|\s*INDIAN|\s*BRITISH)/i,
    ];

    // Try to extract surname - improved logic
    for (const pattern of surnamePatterns) {
      const match = normalizedText.match(pattern);
      if (match && match[1]) {
        let surname = match[1].trim();
        // Clean and validate surname
        surname = surname.replace(/\s+/g, " ").trim();

        if (
          surname.length > 2 &&
          !surname.includes("REPUBLIC") &&
          !surname.includes("INDIA") &&
          !surname.includes("PASSPORT") &&
          !surname.includes("HIRE") &&
          !surname.includes("GIVEN") &&
          !surname.includes("NAME") &&
          !/\d/.test(surname)
        ) {
          // No digits
          extractedData.lastName = surname;
          extractedData.foundFields++;
          console.log("Found surname:", surname);
          break;
        }
      }
    }

    // Try to extract given names - improved logic
    for (const pattern of givenNamePatterns) {
      const match = normalizedText.match(pattern);
      if (match && match[1]) {
        let givenNames = match[1].trim();
        // Clean up given names
        givenNames = givenNames.replace(/\s+/g, " ").trim();

        // Take first name only
        const firstName = givenNames.split(/\s+/)[0];
        if (
          firstName &&
          firstName.length > 1 &&
          !firstName.includes("REPUBLIC") &&
          !firstName.includes("INDIA") &&
          !firstName.includes("INDIAN") &&
          !firstName.includes("BRITISH") &&
          !firstName.includes("PASSPORT") &&
          !/\d/.test(firstName)
        ) {
          extractedData.firstName = firstName;
          extractedData.foundFields++;
          console.log("Found given name:", firstName);
          break;
        }
      }
    }

    // Enhanced MRZ parsing for names (handles "P<INDRAMADUGULA<<SITA<MAHA<LAKSHMI")
    const mrzNamePattern = /P<IND([A-Z]+)<<([A-Z<\s]+)/;
    const mrzMatch = normalizedText.match(mrzNamePattern);
    if (mrzMatch && (!extractedData.lastName || !extractedData.firstName)) {
      // Extract surname from MRZ if not found
      if (!extractedData.lastName && mrzMatch[1]) {
        const mrzSurname = mrzMatch[1].replace(/</g, "").trim();
        if (mrzSurname.length > 2) {
          extractedData.lastName = mrzSurname;
          extractedData.foundFields++;
          console.log("Extracted surname from MRZ:", mrzSurname);
        }
      }

      // Extract given names from MRZ if not found
      if (!extractedData.firstName && mrzMatch[2]) {
        const mrzGivenNames = mrzMatch[2]
          .replace(/</g, " ")
          .replace(/\s+/g, " ")
          .trim();
        const firstNameFromMRZ = mrzGivenNames.split(/\s+/)[0];
        if (firstNameFromMRZ && firstNameFromMRZ.length > 1) {
          extractedData.firstName = firstNameFromMRZ;
          extractedData.foundFields++;
          console.log("Extracted first name from MRZ:", firstNameFromMRZ);
        }
      }
    }

    // If standard patterns don't work, try specific parsing for the format shown
    if (!extractedData.lastName || !extractedData.firstName) {
      // Try to find lines and parse them
      const cleanLines = lines.filter(
        (line) =>
          line.length > 3 &&
          !line.includes("REPUBLIC") &&
          !line.includes("INDIA") &&
          !line.includes("Passport") &&
          !line.includes("Country")
      );

      // Look for surname line (usually after passport number)
      for (let i = 0; i < cleanLines.length; i++) {
        const line = cleanLines[i];
        if (/^[A-Z]{4,25}$/.test(line) && !extractedData.lastName) {
          extractedData.lastName = line.trim();
          extractedData.foundFields++;
          console.log("Found surname from line parsing:", line);
          break;
        }
      }

      // Look for given names line
      for (let i = 0; i < cleanLines.length; i++) {
        const line = cleanLines[i];
        if (
          /^[A-Z][A-Z\s]{5,40}$/.test(line) &&
          line !== extractedData.lastName &&
          !extractedData.firstName
        ) {
          const firstName = line.trim().split(/\s+/)[0];
          extractedData.firstName = firstName;
          extractedData.foundFields++;
          console.log("Found given name from line parsing:", firstName);
          break;
        }
      }
    }

    // Enhanced Date of Birth patterns for Indian and UK format (DD/MM/YYYY)
    const dobPatterns = [
      // Standard DD/MM/YYYY format - look for birth date pattern
      /(\d{2}\/\d{2}\/\d{4})/g,
      // With labels
      /(?:Date\s*of\s*Birth\s*[:\-]?\s*)(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i,
      /(?:DOB\s*[:\-]?\s*)(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i,
      // Handle OCR typos like "Daeof Binh"
      /(?:Date?\s*of?\s*Bi[nr]th?\s*[:\-]?\s*)(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i,
      // MRZ format extraction (YYMMDD)
      /[MF](\d{6})/,
    ];

    // Special handling for dates - find all dates and determine which is birth vs expiry
    const allDates = normalizedText.match(/\d{2}\/\d{2}\/\d{4}/g);
    if (allDates && allDates.length >= 1) {
      // Sort dates and assume first one is DOB (usually appears first)
      const sortedDates = allDates
        .map((date) => {
          const parts = date.split("/");
          return {
            original: date,
            year: parseInt(parts[2]),
            sortKey:
              parseInt(parts[2]) * 10000 +
              parseInt(parts[1]) * 100 +
              parseInt(parts[0]),
          };
        })
        .sort((a, b) => a.sortKey - b.sortKey);

      // Birth date should be older (smaller year), expiry should be newer
      for (const dateObj of sortedDates) {
        if (
          dateObj.year >= 1920 &&
          dateObj.year <= 2010 &&
          !extractedData.dateOfBirth
        ) {
          // This looks like a birth date
          const dateParts = dateObj.original.split("/");
          const day = dateParts[0].padStart(2, "0");
          const month = dateParts[1].padStart(2, "0");
          const year = dateParts[2];
          extractedData.dateOfBirth = `${year}-${month}-${day}`;
          extractedData.foundFields++;
          console.log("Found DOB:", dateObj.original);
          break;
        }
      }

      // Find expiry date (should be in the future)
      for (const dateObj of sortedDates) {
        if (
          dateObj.year >= 2015 &&
          dateObj.year <= 2040 &&
          !extractedData.expiryDate
        ) {
          const dateParts = dateObj.original.split("/");
          const day = dateParts[0].padStart(2, "0");
          const month = dateParts[1].padStart(2, "0");
          const year = dateParts[2];
          extractedData.expiryDate = `${year}-${month}-${day}`;
          extractedData.foundFields++;
          console.log("Found expiry date:", dateObj.original);
          break;
        }
      }
    }

    // Fallback to pattern matching if date extraction above didn't work
    if (!extractedData.dateOfBirth) {
      for (const pattern of dobPatterns) {
        const matches = normalizedText.match(pattern);
        if (matches) {
          for (const match of matches) {
            const dateStr = typeof match === "string" ? match : match[1];

            if (dateStr.length === 6) {
              // MRZ format YYMMDD
              const year = parseInt(dateStr.substring(0, 2));
              const month = dateStr.substring(2, 4);
              const day = dateStr.substring(4, 6);
              const fullYear = year > 50 ? 1900 + year : 2000 + year; // Assume 1950-2049 range
              extractedData.dateOfBirth = `${fullYear}-${month}-${day}`;
              extractedData.foundFields++;
              break;
            } else if (
              dateStr.includes("/") ||
              dateStr.includes("-") ||
              dateStr.includes(".")
            ) {
              // Standard date format
              const dateParts = dateStr.split(/[\/\-\.]/);
              if (dateParts.length === 3) {
                // Assume DD/MM/YYYY format for Indian passports
                const day = dateParts[0].padStart(2, "0");
                const month = dateParts[1].padStart(2, "0");
                const year = dateParts[2];

                // Validate year (birth date)
                const yearNum = parseInt(year);
                if (yearNum >= 1920 && yearNum <= 2010) {
                  extractedData.dateOfBirth = `${year}-${month}-${day}`;
                  extractedData.foundFields++;
                  break;
                }
              }
            }
          }
          if (extractedData.dateOfBirth) break;
        }
      }
    }

    // Enhanced Sex/Gender patterns
    const sexPatterns = [
      // Look for single M or F
      /\b(M|F)\b(?!\d)/g,
      // With labels
      /(?:Sex\s*[:\-]?\s*)(M|F|Male|Female)/i,
      /(?:Gender\s*[:\-]?\s*)(M|F|Male|Female)/i,
      // MRZ format
      /\d{7}([MF])\d{7}/,
    ];

    for (const pattern of sexPatterns) {
      const matches = normalizedText.match(pattern);
      if (matches) {
        for (const match of matches) {
          const sex = typeof match === "string" ? match : match[1];
          if (sex) {
            const sexUpper = sex.toUpperCase();
            if (sexUpper === "M" || sexUpper === "MALE") {
              extractedData.sex = "Male";
              extractedData.foundFields++;
              break;
            } else if (sexUpper === "F" || sexUpper === "FEMALE") {
              extractedData.sex = "Female";
              extractedData.foundFields++;
              break;
            }
          }
        }
        if (extractedData.sex) break;
      }
    }

    // Enhanced Expiry Date patterns (fallback if not found in date analysis above)
    if (!extractedData.expiryDate) {
      const expiryPatterns = [
        // With labels
        /(?:Date\s*of\s*Expiry\s*[:\-]?\s*)(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i,
        /(?:Expiry\s*[:\-]?\s*)(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i,
        // Look for second date in sequence
        /\d{2}\/\d{2}\/\d{4}\s+(\d{2}\/\d{2}\/\d{4})/,
      ];

      for (const pattern of expiryPatterns) {
        const match = normalizedText.match(pattern);
        if (match && match[1]) {
          const dateStr = match[1];
          if (
            dateStr.includes("/") ||
            dateStr.includes("-") ||
            dateStr.includes(".")
          ) {
            const dateParts = dateStr.split(/[\/\-\.]/);
            if (dateParts.length === 3) {
              const day = dateParts[0].padStart(2, "0");
              const month = dateParts[1].padStart(2, "0");
              const year = dateParts[2];

              // Validate it's a future date (expiry should be in future or recent past)
              const yearNum = parseInt(year);
              if (yearNum >= 2015 && yearNum <= 2040) {
                extractedData.expiryDate = `${year}-${month}-${day}`;
                extractedData.foundFields++;
                break;
              }
            }
          }
        }
      }
    }

    // Enhanced Issue Date patterns
    if (!extractedData.issueDate) {
      const issueDatePatterns = [
        // With labels - handle OCR typos
        /(?:Date\s*of\s*Issue\s*[:\-]?\s*)(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i,
        /(?:Dace\s*of\s*Issue\s*[:\-]?\s*)(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i, // OCR typo
        /(?:Date\s*of[lt]ssue\s*[:\-]?\s*)(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i, // OCR typo "l" or "t" instead of "I"
        /(?:Dsteofiesue\s*[:\-]?\s*)(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i, // OCR typo from your sample
        /(?:Issue\s*[:\-]?\s*)(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i,
        // Pattern: Date pairs - first is usually issue, second is expiry
        /(\d{2}\/\d{2}\/\d{4})\s+\d{2}\/\d{2}\/\d{4}/,
        // Look for date patterns between sex/nationality and expiry
        /(?:[MF]|\bINDIAN\b|\bBRITISH\b).*?(\d{2}\/\d{2}\/\d{4}).*?(?:Date|Expiry|\d{2}\/\d{2}\/\d{4})/i,
      ];

      for (const pattern of issueDatePatterns) {
        const match = normalizedText.match(pattern);
        if (match && match[1]) {
          const dateStr = match[1];
          if (
            dateStr.includes("/") ||
            dateStr.includes("-") ||
            dateStr.includes(".")
          ) {
            const dateParts = dateStr.split(/[\/\-\.]/);
            if (dateParts.length === 3) {
              const day = dateParts[0].padStart(2, "0");
              const month = dateParts[1].padStart(2, "0");
              const year = dateParts[2];

              // Validate it's a reasonable issue date (past date, not too old)
              const yearNum = parseInt(year);
              if (yearNum >= 2000 && yearNum <= 2024) {
                extractedData.issueDate = `${year}-${month}-${day}`;
                extractedData.foundFields++;
                break;
              }
            }
          }
        }
      }
    }

    // Extract Nationality
    if (normalizedText.includes("INDIAN") || normalizedText.includes("IND")) {
      extractedData.nationality = "Indian";
      extractedData.foundFields++;
    } else if (
      normalizedText.includes("BRITISH") ||
      normalizedText.includes("GBR") ||
      normalizedText.includes("UNITED KINGDOM")
    ) {
      extractedData.nationality = "British";
      extractedData.foundFields++;
    }

    // Extract Place of Birth (bonus field)
    const birthPlacePatterns = [
      /(?:Place\s*of\s*Birth\s*[:\-]?\s*)([A-Z][A-Z\s]{2,30})/i,
      /(?:Daeof\s*Binh\s*[:\-]?\s*)([A-Z][A-Z\s]{2,30})/i, // Handle OCR typo from your sample
      // Look for city names after dates and before other passport data
      /\d{4}\s+([A-Z]{3,20})\s+(?:[A-Z]{2}|INDIAN|BRITISH|[MF])/,
      // Direct pattern matching for NEW DELHI, LONDON, etc.
      /\b(NEW\s+DELHI|LONDON|MUMBAI|DELHI|BANGALORE|CHENNAI)\b/i,
      // General place pattern
      /\b([A-Z]{4,20})\b(?=\s*[A-Z]{2}\s*(?:INDIAN|BRITISH)|\s*(?:INDIAN|BRITISH))/,
    ];

    for (const pattern of birthPlacePatterns) {
      const match = normalizedText.match(pattern);
      if (match && match[1]) {
        let place = match[1].trim();
        // Clean up the place name
        place = place.replace(/\s+/g, " ").trim();

        if (
          place &&
          place.length > 3 &&
          !place.includes("REPUBLIC") &&
          !place.includes("PASSPORT") &&
          place !== extractedData.lastName &&
          place !== extractedData.firstName
        ) {
          // Add country based on passport type
          let fullPlace = place;
          if (
            extractedData.nationality === "Indian" ||
            normalizedText.includes("INDIAN")
          ) {
            fullPlace = `${place}, India`;
          } else if (
            extractedData.nationality === "British" ||
            normalizedText.includes("BRITISH")
          ) {
            fullPlace = `${place}, United Kingdom`;
          } else {
            // Default case - just use the place name
            fullPlace = place;
          }

          extractedData.placeOfBirth = fullPlace;
          extractedData.foundFields++;
          console.log("Found place of birth:", fullPlace);
          break;
        }
      }
    }

    // Handle back side specific extraction
    if (side === "back") {
      console.log("Processing back side of passport...");

      // Extract address information
      const addressPatterns = [
        /(?:Address|Permanent\s*Address|Current\s*Address)[:\-\s]*([A-Z0-9\s,\.\-\/]+)/i,
        /(?:Addr)[:\-\s]*([A-Z0-9\s,\.\-\/]+)/i,
      ];

      for (const pattern of addressPatterns) {
        const match = normalizedText.match(pattern);
        if (match) {
          let address = match[1].trim();
          // Clean up address
          address = address.replace(/\s+/g, " ").trim();
          // Limit to reasonable length
          if (address.length > 200) {
            address = address.substring(0, 200) + "...";
          }
          extractedData.currentAddress = address;
          extractedData.foundFields++;
          console.log("Address found:", address);
          break;
        }
      }

      // Extract emergency contact information
      const emergencyPatterns = [
        /(?:Emergency\s*Contact|In\s*Case\s*of\s*Emergency)[:\-\s]*([A-Z\s]+)/i,
        /(?:Contact\s*Person)[:\-\s]*([A-Z\s]+)/i,
      ];

      for (const pattern of emergencyPatterns) {
        const match = normalizedText.match(pattern);
        if (match) {
          const contact = match[1].trim();
          extractedData.emergencyContact = contact;
          extractedData.foundFields++;
          console.log("Emergency Contact found:", contact);
          break;
        }
      }

      // Sometimes passport numbers or additional info might be on back side
      if (!extractedData.passportNumber) {
        const backPassportMatch = normalizedText.match(/([A-Z]\d{7}|\d{9})/);
        if (backPassportMatch) {
          extractedData.passportNumber = backPassportMatch[1];
          extractedData.foundFields++;
          console.log("Passport Number found on back:", backPassportMatch[1]);
        }
      }
    }

    console.log(`Extracted data from ${side} side:`, extractedData);
    return extractedData;
  };

  // Retry OCR function
  const retryOCR = (side = "front") => {
    // Clear errors for the specific side
    if (side === "front") {
      setFrontOcrError(null);
    } else {
      setBackOcrError(null);
    }
    setShowManualFallback(false);

    const preview = side === "front" ? frontPreview : backPreview;

    if (preview) {
      // Convert preview back to file and retry
      fetch(preview)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], `passport-${side}.jpg`, {
            type: "image/jpeg",
          });
          performOCR(file, side);
        });
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
        // Ensure front OCR runs for this newly uploaded file
        setFrontOcrDone(false);
        // Start OCR for the uploaded front file
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
        // We do not run OCR on the back side by default. Keep backOcrDone as-is.
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
      // Reset OCR-done flag when front image removed
      setFrontOcrDone(false);
    } else {
      setBackPreview(null);
      setPassportData((prev) => ({
        ...prev,
        passportBack: null,
      }));
      if (backInputRef.current) backInputRef.current.value = "";
      // Reset OCR-done flag when back image removed
      setBackOcrDone(false);
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
      mobileNumber,
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

    // Mobile number validation
    if (!mobileNumber) {
      newErrors.mobileNumber = "Mobile number is required.";
    } else if (
      !/^\+?[\d\s\-\(\)]{10,15}$/.test(mobileNumber.replace(/\s/g, ""))
    ) {
      newErrors.mobileNumber = "Please enter a valid mobile number.";
    }

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

    // Travel Dates Validation
    if (!passportData.travelStartDate)
      newErrors.travelStartDate = "Travel start date is required.";
    if (!passportData.travelEndDate)
      newErrors.travelEndDate = "Travel end date is required.";

    // Date logic validation
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

      // Check if trip duration is reasonable (not more than 1 year)
      const diffTime = Math.abs(endDate - startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 365) {
        newErrors.travelEndDate = "Trip duration cannot exceed 365 days.";
      }
    }

    // Passport Upload Validation - check both passportData and preview states
    if (!passportFront && !frontPreview) {
      newErrors.passportFront = "Passport front page is required.";
    }
    if (!passportBack && !backPreview) {
      newErrors.passportBack = "Passport back page is required.";
    }

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
      {/* Travel Dates Section */}
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
                    Given Name (as on Passport)
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
                <div className="col-span-2">
                  <label className="block text-sm font-medium  mb-1">
                    Surname
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div className="flex flex-col gap-1">
                  <label className="block text-sm font-medium col-span-2">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    name="mobileNumber"
                    value={passportData.mobileNumber || ""}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 123-4567"
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
