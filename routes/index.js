import { Router } from "express";
import authRoute from "./v1/authRotes.js";
import userRoute from "./v1/userRoute.js";
import messageRoute from "./v1/messageRoutes.js";

const routes = Router();

routes.use("/api/v1/auth", authRoute);
routes.use("/api/v1/users", userRoute);
routes.use("/api/v1/messages", messageRoute);

export default routes;
