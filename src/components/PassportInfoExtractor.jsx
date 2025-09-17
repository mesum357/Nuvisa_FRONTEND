import React, { useState } from "react";

export default function PassportInfoExtractor() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState("");

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/extract-passport", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    setResult(data.result || "Failed to parse passport");
  };

  return (
    <div className="p-4 max-w-lg mx-auto border rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Passport Info Extractor</h2>

      <input type="file" accept="image/*,.pdf" onChange={handleFileChange} />

      <button
        onClick={handleUpload}
        disabled={!file}
        className="mt-4 px-4 py-2 bg-[#7350FF] text-white rounded disabled:opacity-50"
      >
        Extract Info
      </button>

      {result && (
        <pre className="mt-4 p-2 bg-gray-100 rounded text-sm whitespace-pre-wrap">
          {result}
        </pre>
      )}
    </div>
  );
}
