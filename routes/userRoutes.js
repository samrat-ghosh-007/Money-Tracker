import express from "express";
import { registerUser,verifyOtp, resendOtp, loginUser,forgotPassword, resetPassword, getProfile, deleteUser } from "../controllers/userController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", authMiddleware, getProfile);
router.get("/:id", authMiddleware, deleteUser);
router.post("/verify-otp", authMiddleware, verifyOtp);
router.post("/resend-otp", authMiddleware, resendOtp);
router.post("/forgot-password", authMiddleware, forgotPassword);
router.post("/reset-password", authMiddleware, resetPassword);


export default router;
