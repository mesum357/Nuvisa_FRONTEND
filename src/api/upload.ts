import axios from "axios";

import { getPublicApiBase } from "@/utils/adminApiBase";

export const uploadFile = async (file) => {
  const form = new FormData();
  form.append("file", file);

  const url = `${getPublicApiBase() || ""}/upload`;

  try {
    const response = await axios.post(url, form, {
      timeout: 30000,
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    const serverMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error;
    if (serverMessage && typeof serverMessage === "string") {
      const wrapped = new Error(serverMessage);
      wrapped.cause = error;
      throw wrapped;
    }
    throw error;
  }
};

export const deleteFile = async (fileUrl) => {
  if (!fileUrl) {
    throw new Error("File URL is required");
  }

  const url = `${getPublicApiBase() || ""}/upload`;

  const response = await axios.delete(url, {
    data: { fileUrl },
    timeout: 15000,
  });

  return response.data;
};
