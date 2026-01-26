import { Upload, Check, Eye, Download, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { uploadFile, deleteFile } from "@/api/upload";
import { Loader } from "lucide-react";

const DocumentUploadSection = ({
  documents,
  setDocuments,
  onUploadSuccess,
  onUploadError,
  disabled = false,
  isOwner = true,
  totalTravelers = 1,
  loading = false,
}) => {
  const fileInputRefs = useRef({});
  const [deletingFiles, setDeletingFiles] = useState(new Set());
  const [loadingPart, setIsLoading] = useState();

  const documentTypes = [
    {
      id: 1,
      title: "Passport sized photographs",
      description: "Recent passport-sized colour photographs",
      required: true,
      requiredCount: 2,
      field: "passportPhotos",
    },
    {
      id: 2,
      title: "Bank statements (last 3 months)",
      description:
        "Last 3 months showing sufficient funds (recommended £50–£80 per day per person)",
      required: true,
      field: "bankStatements",
    },
    {
      id: 3,
      title: "Employment proof (last 3 months payslips)",
      description: "Payslips for the last 3 months",
      required: true,
      field: "employmentProof",
    },
    {
      id: 4,
      title: "School/College ID Card",
      description: "",
      required: false,
      field: "schoolIdCard",
    },
    {
      id: 5,
      title: "UK visa (minimum 3 months validity after travel end date)",
      description:
        "Passport page showing a valid UK visa (must have at least 3 months validity after your travel end date)",
      required: true,
      field: "ukVisa",
    },
    {
      id: 7,
      title: "Other supporting document",
      description: "Optional additional supporting document",
      required: false,
      multiple: true,
      field: "additionalDocument",
    },
  ];

  const handleFileUpload = async (e, docType) => {
    setIsLoading(docType.field);
    const docId = docType.field

    if (disabled || !isOwner) return; // Prevent file upload when disabled or not owner
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const isPassportPhoto = docId === "passportPhotos"
    const isInsuranceDoc = docId === "insuranceDocument"
    const isAdditionalDoc = docId === "additionalDocument"

    let filesToUpload = files;
    if (isPassportPhoto) {
      const currentUploads = documents[docId]
        ? Array.isArray(documents[docId])
          ? documents[docId]
          : [documents[docId]]
        : [];
      const remainingSlots = 2 - currentUploads.length;
      filesToUpload = files.slice(0, remainingSlots);
    } else if (isInsuranceDoc) {
      const currentUploads = documents[docId]
        ? Array.isArray(documents[docId])
          ? documents[docId]
          : [documents[docId]]
        : [];
      const remainingSlots = totalTravelers - currentUploads.length;
      filesToUpload = files.slice(0, remainingSlots);
    } else if (isAdditionalDoc) {
      filesToUpload = files; // Allow multiple additional documents
    } else {
      filesToUpload = files.slice(0, 1);
    }

    if (fileInputRefs.current[docId]) {
      fileInputRefs.current[docId].value = "";
    }

    try {
      setIsLoading(docType.field);
      const uploadPromises = filesToUpload.map(async (file) => uploadFile(file));

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
          const currentDocs = prev[docId]
            ? Array.isArray(prev[docId])
              ? prev[docId]
              : [prev[docId]]
            : [];
          return {
            ...prev,
            [docId]: [...currentDocs, ...documentData].slice(0, 2),
          };
        });
      } else if (isInsuranceDoc || isAdditionalDoc) {
        setDocuments((prev) => {
          const currentDocs = prev[docId]
            ? Array.isArray(prev[docId])
              ? prev[docId]
              : [prev[docId]]
            : [];
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
        onUploadSuccess(
          (isPassportPhoto || isInsuranceDoc || isAdditionalDoc) ? documentData : documentData[0],
          docId
        );
      }
    } catch (error) {
      console.error("File upload error:", error);
      const errorMessage = "Failed to upload file. Please try again.";
      if (onUploadError) {
        onUploadError(errorMessage);
      }
      setIsLoading(null);
    } finally {
      setIsLoading(null);
    }
  };

  const handleRemoveDocument = async (docId, fileIndex = null) => {
    if (disabled || !isOwner) return; // Prevent document removal when disabled or not owner

    // Get the file to be deleted
    let fileToDelete = null;
    const doc = documents[docId];

    if (doc) {
      const isPassportPhoto = docId === "passportPhotos";
      const isAdditionalDoc = docId === "additionalDocument";

      if ((isPassportPhoto || isAdditionalDoc) && Array.isArray(doc) && fileIndex !== null) {
        fileToDelete = doc[fileIndex];
      } else if (!Array.isArray(doc)) {
        fileToDelete = doc;
      }
    }

    // Create a unique identifier for this deletion operation
    const deletionId = `${docId}-${fileIndex}`;

    // Optimistically update UI first
    setDocuments((prev) => {
      const newDocs = { ...prev };

      const isPassportPhoto = docId === "passportPhotos";
      const isAdditionalDoc = docId === "additionalDocument";

      if (
        (isPassportPhoto || isAdditionalDoc) &&
        Array.isArray(prev[docId]) &&
        fileIndex !== null
      ) {
        const updatedList = prev[docId].filter(
          (_, index) => index !== fileIndex
        );
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

    // Reset file input
    if (fileInputRefs.current[docId]) {
      fileInputRefs.current[docId].value = "";
    }

    // Try to delete from server (don't block UI)
    if (fileToDelete?.preview) {
      setDeletingFiles(prev => new Set(prev).add(deletionId));

      try {
        await deleteFile(fileToDelete.preview);
      } catch (error) {
        console.error(`Failed to delete file from server: ${fileToDelete.name}`, error);
        // Note: We don't revert the UI change here as the file is already "removed" from the user's perspective
        // The server cleanup failure is logged but doesn't affect the user experience

        // Optionally, you could show a toast notification here:
        if (onUploadError) {
          onUploadError(`Warning: File removed from form but server cleanup failed for ${fileToDelete.name}`);
        }
      } finally {
        setDeletingFiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(deletionId);
          return newSet;
        });
      }
    }
  };

  const handleViewDocument = (docId, fileIndex = 0) => {
    const doc = documents?.[docId];
    if (doc) {
      const targetDoc = Array.isArray(doc) ? doc[fileIndex] : doc;
      if (targetDoc) {
        window.open(targetDoc.preview, "_blank");
      }
    }
  };
  const handleDownloadDocument = async (fileObject) => {
    if (!fileObject || !fileObject.preview) {
      console.error("Invalid file object provided.");
      return;
    }

    try {
      // Method 1: Try fetch + blob approach first (most reliable for downloads)
      const response = await fetch(fileObject.preview, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Accept': '*/*',
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        // Create download link
        const downloadLink = document.createElement("a");
        downloadLink.href = blobUrl;
        downloadLink.download = fileObject.name || "document";
        downloadLink.style.display = "none";
        
        // Add to DOM, trigger download, then clean up
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        // Clean up blob URL
        setTimeout(() => {
          window.URL.revokeObjectURL(blobUrl);
        }, 100);
        
        return; // Success, exit early
      }
    } catch (fetchError) {
      console.log("Fetch method failed, trying direct download:", fetchError);
    }

    try {
      // Method 2: Direct download approach
      const link = document.createElement("a");
      link.href = fileObject.preview;
      link.download = fileObject.name || "document";
      link.style.display = "none";
      
      // Add to DOM, trigger download, then clean up
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (directError) {
      console.error("Direct download failed:", directError);
      
      // Method 3: Final fallback - open in new tab
      window.open(fileObject.preview, "_blank");
    }
  };

  const completedCount = Object.keys(documents).length;
  const totalCount = documentTypes.length;
  const requiredCount = documentTypes.filter((doc) => doc.required).length;
  const completedRequiredCount = documentTypes.filter((doc) => {
    if (!doc.required) return false;
    if (!documents[doc.field]) return false;

    if (doc.field === "passportPhotos") {
      const uploadedFiles = Array.isArray(documents[doc.field]) ? documents[doc.field] : [documents[doc.field]];
      return uploadedFiles.length >= 2;
    }

    return true;
  }).length;

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
          const isUploaded = documents[docType.field];
          const isPassportPhoto = docType.field === "passportPhotos";
          const uploadedFiles = Array.isArray(isUploaded)
            ? isUploaded
            : isUploaded
              ? [isUploaded]
              : [];
          const canUploadMore =
            (isPassportPhoto && uploadedFiles.length < 2) || docType.multiple;

          const isComplete = isPassportPhoto
            ? uploadedFiles.length >= 2
            : !!isUploaded;

          return (
            <div key={docType.id} className="p-6 border   border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 ">
                  <div className="flex items-center gap-4 ">
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isComplete
                        ? "bg-green-900/50"
                        : "bg-gray-600"
                        }`}
                    >
                      {isComplete ? (
                        <Check className="w-5 h-5 text-green-400" />
                      ) : (
                        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                      )}
                    </div>
                    <div className="text-base font-semibold text-gray-100  flex items-center gap-2 w-full">
                      <div className="flex items-center gap-2">
                        <span className="max-w-40 min-w-40">
                          {docType.title}
                        </span>

                        {!isComplete && <span
                          className={`text-xs font-medium px-2 py-1 rounded-full ${docType.required
                            ? "bg-red-900/30 text-red-400"
                            : "bg-gray-700 text-gray-400"
                            }`}
                        >
                          {docType.required ? "Required" : "Optional"}
                        </span>}

                        {isPassportPhoto && (
                          <span className="text-xs text-gray-400">
                            ({uploadedFiles.length}/2)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm :text-gray-400 mt-1 ">
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

                <div className="self-start min-w-30">
                  {(!isUploaded || canUploadMore) && (
                    <>
                      <input
                        type="file"
                        ref={(el) => (fileInputRefs.current[docType.field] = el)}
                        onChange={(e) => handleFileUpload(e, docType)}
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.zip,.env"
                        id={`file-upload-${docType.field}`}
                        multiple={isPassportPhoto || !!docType.multiple}
                        disabled={disabled || !isOwner || loadingPart === docType.field}
                      />
                      <label
                        htmlFor={`file-upload-${docType.field}`}
                        className={`${disabled || !isOwner || loadingPart === docType.field
                          ? "bg-gray-600 cursor-not-allowed text-white"
                          : "bg-purple-600 text-white cursor-pointer hover:bg-purple-700"
                          } font-semibold px-6 py-2.5 rounded-lg transition-colors min-w-32 `}
                      >
                        {!isOwner ? "View Only" : (isUploaded && canUploadMore ? "Add More" : loadingPart === docType.field ? "Uploading..." : "Upload")}
                      </label>
                    </>
                  )}
                </div>
              </div>

                  {isUploaded && (
  <div className="pl-12 mt-4 space-y-2 max-sm:pl-0">
    {uploadedFiles.map((file, index) => (
      <div
        key={index}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gray-800 p-3 rounded-lg gap-3 sm:gap-0"
      >
        {/* LEFT SIDE — FILE INFO */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-300 font-medium truncate">
            {file.name}
            {isPassportPhoto && (
              <span className="ml-2 text-xs text-gray-500">
                Photo {index + 1}
              </span>
            )}
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-1 text-xs text-gray-500">
            <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
            <span>
              Uploaded{" "}
              {new Date(file.uploadedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </span>
          </div>
        </div>

        {/* RIGHT SIDE — ACTION BUTTONS */}
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => handleViewDocument(docType?.field, index)}
            className="p-2 text-blue-400 hover:text-blue-300 hover:bg-gray-700 rounded-md transition-colors"
            title="View document"
          >
            View
          </button>

          <button
            onClick={() => handleDownloadDocument(file)}
            className="p-2 text-green-400 hover:text-green-300 hover:bg-gray-700 rounded-md transition-colors"
            title="Download document"
          >
            Download
          </button>

          {isOwner && (
            <button
              onClick={() =>
                !disabled &&
                handleRemoveDocument(
                  docType.field,
                  isPassportPhoto ? index : null
                )
              }
              className={`p-2 rounded-md transition-colors ${
                disabled ||
                deletingFiles.has(
                  `${docType.id}-${isPassportPhoto ? index : null}`
                )
                  ? "text-gray-500 cursor-not-allowed"
                  : "text-gray-400 hover:text-red-400 hover:bg-gray-700 cursor-pointer"
              }`}
              title={
                disabled
                  ? "Cannot remove document"
                  : deletingFiles.has(
                      `${docType.id}-${isPassportPhoto ? index : null}`
                    )
                  ? "Deleting..."
                  : "Remove document"
              }
              disabled={
                disabled ||
                deletingFiles.has(
                  `${docType.id}-${isPassportPhoto ? index : null}`
                )
              }
            >
              {deletingFiles.has(
                `${docType.id}-${isPassportPhoto ? index : null}`
              ) ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin"></div>
              ) : (
                <Trash2 className="w-5 h-5" />
              )}
            </button>
          )}
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
