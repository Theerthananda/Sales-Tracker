const uploadToS3 = async (file) => {
  const filename = `${Date.now()}-${file.originalname}`;
  const filepath = `/uploads/${filename}`;
  
  return filepath;
};

module.exports = uploadToS3;
