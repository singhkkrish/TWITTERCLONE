const axios = require('axios');
const FormData = require('form-data');

const uploadToImgBB = async (imageBuffer, imageName) => {
  try {
    const formData = new FormData();
    formData.append('image', imageBuffer.toString('base64'));
    formData.append('name', imageName);

    const response = await axios.post(
      `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
      formData,
      {
        headers: formData.getHeaders()
      }
    );

    return response.data.data.url;
  } catch (error) {
    throw new Error('Image upload failed');
  }
};

module.exports = { uploadToImgBB };
