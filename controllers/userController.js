import getPrismaInstance from "../utils/PrismaClient.js";

export const getAllUser = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    const users = await prisma.user.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        email: true,
        name: true,
        profileImage: true,
        about: true,
      },
    });

    return res.status(200).json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};
