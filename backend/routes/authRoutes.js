const express = require("express");
const fs = require("fs");
const {
  registerUser,
  loginUser,
  getUserProfile,
} = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");

const router = express.Router();

// Auth Routes
router.post("/register", registerUser); // Register User
router.post("/login", loginUser); // Login User
router.get("/profile", protect, getUserProfile); // Get User Profile

router.post("/upload-image", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  try {
    const filePath = req.file.path;
    const fileBuffer = fs.readFileSync(filePath);
    const base64Image = fileBuffer.toString("base64");
    const mimeType = req.file.mimetype;
    const imageUrl = `data:${mimeType};base64,${base64Image}`;

    // Delete the file from the local disk to save space
    fs.unlinkSync(filePath);

    res.status(200).json({ imageUrl });
  } catch (error) {
    console.error("Error processing upload-image:", error);
    res.status(500).json({ message: "Failed to process image", error: error.message });
  }
});

module.exports = router;