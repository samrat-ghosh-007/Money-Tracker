import express from "express";
import {
  getAccounts,
  addCard,
  updateAccount,
  initDefaultAccounts,
  deleteAccount
} from "../controllers/accountController.js";
import { authMiddleware } from "../middleware/auth.js"; 
const router = express.Router();

 


router.post("/init", authMiddleware, initDefaultAccounts);
router.get("/", authMiddleware, getAccounts);
router.post("/",authMiddleware, addCard);
router.patch("/:id",authMiddleware, updateAccount);
router.delete("/:id",authMiddleware, deleteAccount);



export default router;
