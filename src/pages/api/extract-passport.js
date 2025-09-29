import { ClientV2, BufferInput } from "mindee";
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: { bodyParser: false }, // Correctly disable body parser for file uploads
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Wrap formidable in a Promise to safely handle async operations in Next.js
    const data = await new Promise((resolve, reject) => {
      const form = formidable({ multiples: false });
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve({ fields, files });
      });
    });

    // Correctly get the file object. 'files.file' can be an array or a single object.
    const uploadedFile = data.files.file;
    const file = Array.isArray(uploadedFile) ? uploadedFile[0] : uploadedFile;

    if (!file) {
      // Send a clear error if no file with the name 'file' was found in the form data.
      return res.status(400).json({ error: "No file with the name 'file' was uploaded." });
    }

    // Initialize the Mindee ClientV2 with your API key
    const api_key = process.env.MINDEE_API_KEY || "md_rvtU59yTx2sBb89vk75p7DKgTCMSLKKR";
    const model_id = "e9e60729-1368-4e9b-89e1-7b9a0a99a3cf";
    
    const client = new ClientV2({ apiKey: api_key });

    // Read file into a buffer
    const buffer = fs.readFileSync(file.filepath);
    
  const input_source = new BufferInput({ buffer, filename: file.originalFilename || file.newFilename || "upload.jpg" });

  if (file.mimetype) input_source.mimeType = file.mimetype;

    // Send for processing using polling with custom model
    // The SDK may expect the model to be an object with an `id` field
    const response = await client.enqueueAndGetInference(
      input_source,
      {
        model: { id: model_id },
        // fallback keys in case different naming is expected by the SDK
        modelId: model_id,
        model_id: model_id,
        pollingOptions: {
          maxRetries: 30,
          delaySec: 2,
          initialDelaySec: 1,
        },
      }
    );

    if (!response || !response.inference) {
      return res.status(500).json({ error: "Failed to get a valid response from the API." });
    }

    // Log full response for debugging
    try {
      console.log("Mindee full response:", JSON.stringify(response, null, 2));
    } catch (e) {
      console.log("Mindee response (could not stringify):", response);
    }

    // Best-effort: find the model's field object in the response. Mindee V2 custom
    // models often return the useful fields under raw.rawHttp.inference.result.fields
    const getFieldsObj = (resp) => {
      return (
        resp?.raw?.rawHttp?.inference?.result?.fields ||
        resp?.rawHttp?.inference?.result?.fields ||
        resp?.raw?.inference?.result?.fields ||
        resp?.inference?.raw?.inference?.result?.fields ||
        resp?.inference?.result?.fields ||
        resp?.result?.fields ||
        resp?.fields ||
        null
      );
    };

    const fieldsObj = getFieldsObj(response) || getFieldsObj(response.inference) || {};

    // Helper to safely read a field value
    const readVal = (f) => {
      if (!f) return null;
      if (typeof f === "object") return f.value ?? f.text ?? f.raw ?? null;
      return f;
    };

    // Map model fields to frontend fields
    const mapped = {
      firstName: readVal(fieldsObj.given_names) || readVal(fieldsObj.given_name) || null,
      lastName: readVal(fieldsObj.surnames) || readVal(fieldsObj.surname) || null,
      passportNumber: readVal(fieldsObj.passport_number) || readVal(fieldsObj.passport_no) || readVal(fieldsObj.number) || null,
      dateOfBirth: readVal(fieldsObj.date_of_birth) || readVal(fieldsObj.dob) || null,
      sex: (() => {
        const s = readVal(fieldsObj.sex) || readVal(fieldsObj.gender) || null;
        if (!s) return null;
        const lower = String(s).toLowerCase();
        if (lower.startsWith("m")) return "Male";
        if (lower.startsWith("f")) return "Female";
        return s;
      })(),
      passportIssueDate: readVal(fieldsObj.date_of_issue) || readVal(fieldsObj.issue_date) || null,
      passportExpiryDate: readVal(fieldsObj.date_of_expiry) || readVal(fieldsObj.expiration_date) || null,
      placeOfBirth: readVal(fieldsObj.place_of_birth) || readVal(fieldsObj.birth_place) || null,
      nationality: readVal(fieldsObj.nationality) || null,
      issuingCountry: readVal(fieldsObj.issuing_country) || null,
      mrzLine1: readVal(fieldsObj.mrz_line_1) || readVal(fieldsObj.mrz1) || null,
      mrzLine2: readVal(fieldsObj.mrz_line_2) || readVal(fieldsObj.mrz2) || null,
    };

    // Also include any raw simple key-values for developer inspection
    const simpleFields = {};
    for (const [k, v] of Object.entries(fieldsObj || {})) {
      simpleFields[k] = readVal(v);
    }

    res.status(200).json({ raw: response, extractedFields: mapped, simpleFields });

  } catch (error) {
    // Provide more specific error details back to the client if possible
    const errorMessage = error.details || error.message || "A server-side error occurred during parsing.";
    const statusCode = error.statusCode || 500;
    console.error("Mindee processing error:", error);
    res.status(statusCode).json({ error: errorMessage });
  }
}