import multer from "multer";//to send file to DiskStorage

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
})

export const upload = multer({ storage, })