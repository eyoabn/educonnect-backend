const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// ═══ CLOUDINARY CONFIGURATION ═══
// Fill in your credentials from https://cloudinary.com/console
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,   // e.g. 'my-cloud'
  api_key:    process.env.CLOUDINARY_API_KEY,       // e.g. '123456789012345'
  api_secret: process.env.CLOUDINARY_API_SECRET,   // e.g. 'abcdefghijklmnopqrstuvwxyz'
});

// Storage: uploads to the 'educonnect/assignments' folder in Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'educonnect/assignments',
    resource_type: 'auto',                          // supports pdf, docx, images, etc.
    public_id: `submission_${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`,
    allowed_formats: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg', 'txt', 'zip'],
  }),
});

// 10 MB max file size
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/png', 'image/jpeg', 'image/jpg',
      'text/plain',
      'application/zip',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not supported. Please upload PDF, DOC, DOCX, image, or ZIP files.'));
    }
  },
});

module.exports = { cloudinary, upload };
