// src/lib/upload.js

const upload = async (image) => {
  try {
    if (!image) {
      throw new Error("No image selected");
    }

    // Debug logs (remove in production)
    console.log("Cloud Name:", import.meta.env.VITE_CLOUD_NAME);
    console.log("Upload Preset:", import.meta.env.VITE_UPLOAD_PRESET);

    const cloudName = import.meta.env.VITE_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error("Cloudinary environment variables missing");
    }

    const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    const formData = new FormData();
    formData.append("file", image);
    formData.append("upload_preset", uploadPreset);

    const res = await fetch(url, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Cloudinary Error Response:", data);
      throw new Error("Image upload failed");
    }

    return data.secure_url;

  } catch (error) {
    console.error("Upload Error:", error);
    throw error;
  }
};

export default upload;
