import getPrismaInstance from "../utils/PrismaClient.js";
import { generateToken04 } from "../utils/TokenGenerator.js";

export const checkUser = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.json({ success: false, message: "Email is required" });

    const prisma = getPrismaInstance();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    } else {
      return res.status(200).json({ success: true, data: user });
    }
  } catch (err) {
    next(err);
  }
};

export const createUser = async (req, res, next) => {
  try {
    console.log(req.body);
    const { email, name, about, profileImage } = req.body;
    if (!email || !name || !profileImage) {
      return res.json({
        success: false,
        message: "Email, Name, Image is required",
      });
    }
    const prisma = getPrismaInstance();
    await prisma.user.create({
      data: { email, name, about, profileImage },
    });
    return res
      .status(200)
      .json({ success: true, message: "Create Successfully" });
  } catch (err) {
    next(err);
  }
};

export const generateToken = async (req, res, next) => {
  try {
    const appId = parseInt(process.env.ZEGO_APP_ID);
    const serverSecret = process.env.ZEGO_APP_SERVER;

    const { userId } = req.params;
    const effectiveTime = 3600;
    const payload = "";
    if (appId && serverSecret && userId) {
      const token = generateToken04(
        appId,
        userId,
        serverSecret,
        effectiveTime,
        payload
      );
      res.status(200).json({ success: true, token });
    }
  } catch (err) {
    next(err);
  }
};
