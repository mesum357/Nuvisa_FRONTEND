import { Upload, Check, Eye, Download, Trash2 } from "lucide-react";
import { useRef } from "react";
import { uploadFile } from "@/api/upload";

const DocumentUploadSection = ({
  documents,
  setDocuments,
  onUploadSuccess,
  onUploadError,
}) => {
  const fileInputRefs = useRef({});

  const documentTypes = [
    {
      id: 1,
      title: "Passport sized photographs",
      description: "Recent passport-sized colour photographs",
      required: true,
    },
    {
      id: 2,
      title: "Bank statements (last 3 months)",
      description:
        "Last 3 months showing sufficient funds (recommended £50–£80 per day per person)",
      required: true,
    },
    {
      id: 3,
      title: "Employment proof (last 3 months payslips)",
      description: "Payslips for the last 3 months",
      required: true,
    },
    {
      id: 4,
      title: "School/College/Institute ID Card",
      description: "",
      required: false,
    },
    {
      id: 5,
      title: "UK visa (minimum 3 months validity after travel end date)",
      description:
        "Passport page showing a valid UK visa (must have at least 3 months validity after your travel end date)",
      required: true,
    },
    {
      id: 6,
      title: "Other supporting document",
      description: "Optional additional supporting document",
      required: false,
      multiple: true,
    },
  ];

  const handleFileUpload = async (e, docId) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const isPassportPhoto = docId === 1;
    const isAdditionalDoc = docId === 6;

    let filesToUpload = files;
    if (isPassportPhoto) {
      const currentUploads = documents[docId] ? (Array.isArray(documents[docId]) ? documents[docId] : [documents[docId]]) : [];
      const remainingSlots = 2 - currentUploads.length;
      filesToUpload = files.slice(0, remainingSlots);
    } else if (isAdditionalDoc) {
      filesToUpload = files;
    } else {
      filesToUpload = files.slice(0, 1);
    }

    if (fileInputRefs.current[docId]) {
      fileInputRefs.current[docId].value = "";
    }

    try {
      const uploadPromises = filesToUpload.map(file => uploadFile(file));
      const uploadResults = await Promise.all(uploadPromises);

      const documentData = filesToUpload.map((file, index) => ({
        file,
        preview: uploadResults[index]?.url,
        name: file.name,
        type: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      }));

      if (isPassportPhoto) {
        setDocuments((prev) => {
          const currentDocs = prev[docId] ? (Array.isArray(prev[docId]) ? prev[docId] : [prev[docId]]) : [];
          return {
            ...prev,
            [docId]: [...currentDocs, ...documentData].slice(0, 2),
          };
        });
      } else if (isAdditionalDoc) {
        setDocuments((prev) => {
          const currentDocs = prev[docId] ? (Array.isArray(prev[docId]) ? prev[docId] : [prev[docId]]) : [];
          return {
            ...prev,
            [docId]: [...currentDocs, ...documentData],
          };
        });
      } else {
        setDocuments((prev) => ({
          ...prev,
          [docId]: documentData[0],
        }));
      }

      if (onUploadSuccess) {
        onUploadSuccess(isPassportPhoto ? documentData : documentData[0], docId);
      }
    } catch (error) {
      const errorMessage = "Failed to upload file. Please try again.";
      if (onUploadError) {
        onUploadError(errorMessage);
      }
    }
  };

  const handleRemoveDocument = (docId, fileIndex = null) => {
    setDocuments((prev) => {
      const newDocs = { ...prev };

      const isPassportPhoto = docId === 1;
      const isAdditionalDoc = docId === 6;

      if ((isPassportPhoto || isAdditionalDoc) && Array.isArray(prev[docId]) && fileIndex !== null) {
        const updatedList = prev[docId].filter((_, index) => index !== fileIndex);
        if (updatedList.length > 0) {
          newDocs[docId] = updatedList;
        } else {
          delete newDocs[docId];
        }
      } else {
        delete newDocs[docId];
      }

      return newDocs;
    });

    if (fileInputRefs.current[docId]) {
      fileInputRefs.current[docId].value = "";
    }
  };

  const handleViewDocument = (docId, fileIndex = 0) => {
    const doc = documents[docId];
    if (doc) {
      const targetDoc = Array.isArray(doc) ? doc[fileIndex] : doc;
      if (targetDoc) {
        window.open(targetDoc.preview, "_blank");
      }
    }
  };

  const handleDownloadDocument = (docId, fileIndex = 0) => {
    const doc = documents[docId];
    if (doc) {
      const targetDoc = Array.isArray(doc) ? doc[fileIndex] : doc;
      if (targetDoc) {
        const link = document.createElement("a");
        link.href = targetDoc.preview;
        link.download = targetDoc.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  };

  const completedCount = Object.keys(documents).length;
  const totalCount = documentTypes.length;
  const requiredCount = documentTypes.filter((doc) => doc.required).length;
  const completedRequiredCount = documentTypes.filter(
    (doc) => doc.required && documents[doc.id]
  ).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center">
            <Upload className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-white">
            Upload your documents
          </h3>
          <span className="text-sm text-gray-500">
            {completedCount} / {totalCount} total ({completedRequiredCount} /{" "}
            {requiredCount} required)
          </span>
        </div>
      </div>

      {/* Document List */}
      <div>
        {documentTypes.map((docType) => {
          const isUploaded = documents[docType.id];
          const isPassportPhoto = docType.id === 1;
          const uploadedFiles = Array.isArray(isUploaded) ? isUploaded : isUploaded ? [isUploaded] : [];
          const canUploadMore = (isPassportPhoto && uploadedFiles.length < 2) || docType.multiple;

          return (
            <div key={docType.id} className="p-6 border   dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4  ">
                  <div className="flex items-center gap-4 max-w-56 w-full">
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUploaded
                        ? "bg-green-600 dark:bg-green-900/50"
                        : "bg-gray-400 dark:bg-gray-600"
                        }`}
                    >
                      {isUploaded ? (
                        <Check className="w-5 h-5 text-white dark:text-green-400" />
                      ) : (
                        <div className="w-2 h-2 bg-white dark:bg-gray-300 rounded-full"></div>
                      )}
                    </div>
                    <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 w-full flex items-center gap-2">
                      {docType.title}
                      {isPassportPhoto && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          ({uploadedFiles.length}/2)
                        </span>
                      )}
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${docType.required
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                          }`}
                      >
                        {docType.required ? "Required" : "Optional"}
                      </span>
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {docType.description}
                  </p>
                  <div className="flex-1">
                    {docType.tag && (
                      <span className="mt-2 inline-block   text-xs font-semibold px-3 py-1 rounded">
                        {docType.tag}
                      </span>
                    )}
                  </div>
                </div>

                <div className="self-start">
                  {(!isUploaded || canUploadMore) && (
                    <>
                      <input
                        type="file"
                        ref={(el) => (fileInputRefs.current[docType.id] = el)}
                        onChange={(e) => handleFileUpload(e, docType.id)}
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.zip,.env"
                        id={`file-upload-${docType.id}`}
                        multiple={isPassportPhoto || !!docType.multiple}
                      />
                      <label
                        htmlFor={`file-upload-${docType.id}`}
                        className="bg-purple-600 text-white font-semibold px-6 py-2.5 rounded-lg cursor-pointer hover:bg-purple-700 transition-colors"
                      >
                        {isUploaded && canUploadMore ? "Add More" : "Upload"}
                      </label>
                    </>
                  )}
                </div>
              </div>

              {isUploaded && (
                <div className="pl-12 mt-4 space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                        {file.name}
                        {isPassportPhoto && (
                          <span className="ml-2 text-xs text-gray-500">
                            Photo {index + 1}
                          </span>
                        )}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDocument(docType.id, index)}
                          className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                          title="View document"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDownloadDocument(docType.id, index)}
                          className="p-2 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                          title="Download document"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleRemoveDocument(docType.id, isPassportPhoto ? index : null)}
                          className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                          title="Remove document"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DocumentUploadSection;
