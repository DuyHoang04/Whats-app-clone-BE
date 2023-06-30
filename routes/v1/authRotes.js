import { Router } from "express";
import {
  checkUser,
  createUser,
  generateToken,
} from "../../controllers/authController.js";

const router = Router();

router.post("/check-user", checkUser);
router.post("/create-user", createUser);
router.post("/generate-token/:userId", generateToken);

export default router;
