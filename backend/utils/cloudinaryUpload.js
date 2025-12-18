const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadAudioToCloudinary = async (audioBuffer, fileName) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'video',
        folder: 'twitter-clone/audio',
        public_id: `audio_${Date.now()}`,
        allowed_formats: ['mp3', 'wav', 'ogg', 'webm', 'aac', 'm4a', 'mpeg']
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      }
    );

    uploadStream.end(audioBuffer);
  });
};

module.exports = { uploadAudioToCloudinary };
