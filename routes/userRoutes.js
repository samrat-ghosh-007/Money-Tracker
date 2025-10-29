import express from "express";
import { registerUser, loginUser, getProfile, deleteUser } from "../controllers/userController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", authMiddleware, getProfile);
router.delete("/:id", authMiddleware, deleteUser);


export default router;
