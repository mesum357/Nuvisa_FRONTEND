import axios from "axios";

export const uploadFile = async (file) => {
  const form = new FormData();
  form.append("file", file);

  const url = `${process.env.NEXT_PUBLIC_API_URL || ""}/upload`;

  const response = await axios.post(url, form, {
    timeout: 30000, 
  });

  return response.data;
};
