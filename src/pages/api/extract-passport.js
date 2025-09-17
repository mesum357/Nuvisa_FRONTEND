import * as mindee from "mindee";
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: { bodyParser: false }, // disable body parser for file uploads
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Upload error:", err);
      return res.status(500).json({ error: "File upload failed" });
    }

    try {
      const uploadedFile = files.file;

      if (!uploadedFile) {
        return res.status(400).json({ error: "No file received" });
      }

      // Read file into a buffer
      const buffer = fs.readFileSync(uploadedFile.filepath || uploadedFile.path);

      const client = new mindee.Client({
        apiKey: process.env.MINDEE_API_KEY || "your-api-key",
      });

      // Use buffer instead of path
      const inputSource = client.docFromBuffer(buffer, uploadedFile.originalFilename);

      const apiResponse = await client.parse(
        mindee.product.PassportV1,
        inputSource
      );

      res.status(200).json({ result: apiResponse.document.toString() });
    } catch (error) {
      console.error("Mindee parse error:", error);
      res.status(500).json({ error: "Passport parsing failed" });
    }
  });
}
