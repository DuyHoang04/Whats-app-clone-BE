import { Router } from "express";
import {
  addMessage,
  getMessages,
  addMessageImage,
  getInitialContactWithMessage,
} from "../../controllers/messageController.js";

const router = Router();

router.post("/add-message", addMessage);
router.get("/get-message", getMessages);
router.post("/add-message-image", addMessageImage);
router.get("/get-contact-mess/:userId", getInitialContactWithMessage);

export default router;
