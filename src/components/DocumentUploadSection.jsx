import { ChevronDown, Download, File } from "lucide-react";
import { useState, useRef } from "react";

const DocumentUploadSection = ({ documents, setDocuments }) => {
  const fileInputRefs = useRef({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const documentTypes = [
    {
      id: 1,
      title: "Sponsor IT Return",
      description: "Please Upload Sponsor IT Return for 3 Years",
      required: true,
    },
    {
      id: 2,
      title: "Cover letter",
      description:
        "Should indicate the purpose of travel, number of days, passport and travel details. Any abrupt/sudden deposits into your bank statement must be appropriately explained and justified",
      required: true,
    },
    {
      id: 3,
      title:
        "Proof of Fixed Deposits, Property Investments, Other Investments etc.",
      description:
        "Rental Income Receipt, Interest Income, Other Source of savings like fixed deposits, shares and mutual funds",
      required: false,
    },
    {
      id: 4,
      title: "School/College/Institute ID Card",
      description: "",
      required: false,
    },
    {
      id: 5,
      title: "Copy of entry and exit stamp and previous visas held",
      description:
        "Any sticker visas and/or Entry/exit stamp pages on passport for the last 10 years",
      required: true,
    },
  ];

  const handleFileUpload = (e, docId) => {
    const file = e.target.files[0];
    if (!file) return;

    // Simulate upload progress
    setUploadProgress((prev) => Math.min(prev + 1, documentTypes.length));

    const reader = new FileReader();
    reader.onloadend = () => {
      setDocuments((prev) => ({
        ...prev,
        [docId]: {
          file,
          preview: reader.result,
          name: file.name,
          type: file.type,
          size: file.size,
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveDocument = (docId) => {
    setDocuments((prev) => {
      const newDocs = { ...prev };
      delete newDocs[docId];
      return newDocs;
    });
    setUploadProgress((prev) => Math.max(prev - 1, 0));
    fileInputRefs.current[docId].value = "";
  };

  const handleViewDocument = (docId) => {
    const doc = documents[docId];
    if (doc) {
      window.open(doc.preview, "_blank");
    }
  };

  const handleDownloadDocument = (docId) => {
    const doc = documents[docId];
    if (doc) {
      const link = document.createElement("a");
      link.href = doc.preview;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium">Upload your documents</h3>
        <div className="text-sm text-gray-200">
          {uploadProgress} / {documentTypes.length}
        </div>
      </div>

      {documentTypes.map((docType) => (
        <div
          key={docType.id}
          className="border public_border_clr rounded-lg p-4 mb-4"
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className="font-medium">{docType.title}</h4>
              {docType.description && (
                <p className="text-sm text-gray-200 mt-1">
                  {docType.description}
                </p>
              )}
            </div>
            {docType.required && (
              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                Required
              </span>
            )}
          </div>

          {documents[docType.id] ? (
            <div className="mt-3 flex items-center justify-between pri_bg p-3 rounded">
              <div className="flex items-center">
                <div className="bg-purple-100 p-2 rounded mr-3">
                  <svg
                    className="w-5 h-5 text-[#7350FF]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {documents[docType.id].name}
                  </p>
                  <p className="text-xs text-gray-200">
                    {documents[docType.id].type} •{" "}
                    {Math.round(documents[docType.id].size / 1024)} KB
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleViewDocument(docType.id)}
                  className="text-[#7350FF] hover:text-[#7350FF] p-1"
                  title="View document"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => handleDownloadDocument(docType.id)}
                  className="text-green-600 hover:text-green-800 p-1"
                  title="Download document"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => handleRemoveDocument(docType.id)}
                  className="text-red-600 hover:text-red-800 p-1"
                  title="Remove document"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-3">
              <input
                type="file"
                ref={(el) => (fileInputRefs.current[docType.id] = el)}
                onChange={(e) => handleFileUpload(e, docType.id)}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                id={`file-upload-${docType.id}`}
              />
              <label
                htmlFor={`file-upload-${docType.id}`}
                className="flex flex-col items-center justify-center w-full h-32 border-2 public_border_clr border-dashed rounded-lg cursor-pointer pri_bg hover:bg-gray-100"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg
                    className="w-8 h-8 mb-4 text-gray-200"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 20 16"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                    />
                  </svg>
                  <p className="mb-2 text-sm text-gray-200">Click to upload</p>
                </div>
              </label>
            </div>
          )}
        </div>
      ))}
      <div className="border b_color rounded-lg p-6 public_border_clr sec_bg">
        <button
          className="w-full flex justify-between items-center text-left"
          onClick={() => setIsOpen(!isOpen)}
        >
          <h2 className="text-xl font-gilroy-bold">
            Document checklist for your appointment
          </h2>
          <ChevronDown
            className={`w-5 h-5 text-gray-200 transform transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isOpen && (
          <div className="mt-4">
            <div className="mb-6">
              <div className="flex items-center mb-3">
                <span className="w-6 h-6 pri_bg border public_border_clr rounded-full flex items-center justify-center mr-3">
                  1
                </span>
                <h3 className="text-lg font-semibold ">
                  Passport Requirements:
                </h3>
              </div>
              <ul className="list-disc pl-5 space-y-2 text-sm text-gray-300">
                <li>
                  Should be valid for at least six months beyond the trip's
                  duration.
                </li>
                <li>Must have a minimum of 2 blank pages.</li>
                <li>
                  A scanned copy of the first and last page of the passport
                </li>
                <li>
                  Scan and include the first and last pages of your previous
                  passport, along with its travel history.
                </li>
              </ul>
            </div>

            <div className="border public_border_clr rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-purple-100 p-3 rounded-lg mr-4">
                    <File className="w-6 h-6 text-[#7350FF]" />
                  </div>
                  <div>
                    <h3 className="font-medium">Appointment</h3>
                    <p className="text-sm text-gray-200">Confirmation Letter</p>
                  </div>
                </div>
                <button className="text-[#7350FF] hover:text-[#7350FF] flex items-center text-sm font-medium">
                  <Download className="w-4 h-4 mr-2" />
                  Download this Sample file
                </button>
              </div>
            </div>
            <div className="border public_border_clr rounded-lg p-4 mb-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  <div className="bg-green-100 p-3 rounded-lg mr-4 flex-shrink-0">
                    <svg
                      className="w-6 h-6 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium">Checklist of Documents</h3>
                    <p className="text-sm text-gray-200 mt-1">
                      <span className="font-semibold">Visa Will Upload</span> -
                      Uploaded on UK portal
                    </p>
                  </div>
                </div>
                <button
                  className="text-[#7350FF] hover:text-[#7350FF] flex items-center text-sm font-medium"
                  onClick={() => console.log("View document clicked")}
                >
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  View
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentUploadSection;
