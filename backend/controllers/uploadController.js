const { uploadToImgBB } = require('../utils/imageUpload');
const { uploadAudioToCloudinary } = require('../utils/cloudinaryUpload');
const OTP = require('../models/OTP');

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image provided' });
    }

    const imageUrl = await uploadToImgBB(req.file.buffer, req.file.originalname);

    res.json({ url: imageUrl });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({ message: 'Image upload failed', error: error.message });
  }
};

const isAudioUploadAllowed = () => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  const hours = istTime.getUTCHours();
  return hours >= 14 && hours < 19;
};

exports.uploadAudio = async (req, res) => {
  try {
    const { otpId } = req.body;

    if (!otpId) {
      return res.status(403).json({ message: 'OTP verification required for audio upload' });
    }

    const otpRecord = await OTP.findOne({
      _id: otpId,
      userId: req.userId,
      isVerified: true,
      expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
      return res.status(403).json({ message: 'Invalid or expired OTP. Please verify again.' });
    }

    if (!isAudioUploadAllowed()) {
      return res.status(403).json({ 
        message: 'Audio uploads are only allowed between 2:00 PM - 7:00 PM IST' 
      });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No audio file provided' });
    }

    const maxSize = 100 * 1024 * 1024;
    if (req.file.size > maxSize) {
      return res.status(400).json({ message: 'Audio file size exceeds 100 MB limit' });
    }

    const audioUrl = await uploadAudioToCloudinary(req.file.buffer, req.file.originalname);

    await OTP.deleteOne({ _id: otpId });

    res.json({ 
      url: audioUrl,
      size: req.file.size,
      duration: parseInt(req.body.duration) || 0
    });
  } catch (error) {
    console.error('❌ Upload audio error:', error);
    res.status(500).json({ message: 'Audio upload failed', error: error.message });
  }
};
