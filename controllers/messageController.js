import getPrismaInstance from "../utils/PrismaClient.js";

export const addMessage = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    const { message, from, to } = req.body;

    const getUser = onlineUser.get(to);
    if (message && from && to) {
      const newMessage = await prisma.messages.create({
        data: {
          message,
          sender: { connect: { id: parseInt(from) } },
          reciever: { connect: { id: parseInt(to) } },
          messageStatus: getUser ? "delivered" : "sent",
        },
        include: { sender: true, reciever: true },
      });
      return res.status(200).json({ success: true, message: "Success" });
    } else {
      return res.json({
        success: false,
        message: "Mess, From, To is required",
      });
    }
  } catch (err) {
    next(err);
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    const { from, to } = req.query;

    const messages = await prisma.messages.findMany({
      where: {
        OR: [
          {
            senderId: parseInt(from),
            recieverId: parseInt(to),
          },
          {
            senderId: parseInt(to),
            recieverId: parseInt(from),
          },
        ],
      },
      orderBy: {
        id: "asc",
      },
    });

    const unreadMessages = [];

    messages.forEach((message, index) => {
      if (
        message.messageStatus !== "read" &&
        message.senderId === parseInt(to)
      ) {
        messages[index].messageStatus = "read";
        unreadMessages.push(message.id);
      }
    });

    await prisma.messages.updateMany({
      where: {
        id: {
          in: unreadMessages,
        },
      },
      data: {
        messageStatus: "read",
      },
    });

    res.status(200).json({ success: true, data: messages });
  } catch (err) {
    next(err);
  }
};

export const addMessageImage = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const files = req.files;
    const prisma = getPrismaInstance();

    if (from && to) {
      for (let i = 0; i < files.length; i++) {
        await prisma.messages.create({
          data: {
            message: files[i].url,
            sender: { connect: { id: parseInt(from) } },
            reciever: { connect: { id: parseInt(to) } },
            type: "image",
          },
        });
      }
      res.status(200).json({ success: true, message: "SUCCESS" });
    } else {
      return res.json({ success: false, message: "FROM, TO IS REQUIRED" });
    }
  } catch (err) {
    next(err);
  }
};

export const getInitialContactWithMessage = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId);
    console.log(userId);
    const prisma = getPrismaInstance();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        sentMessages: {
          include: {
            reciever: true,
            sender: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        recieverMessages: {
          include: {
            reciever: true,
            sender: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    const messages = [...user.sentMessages, ...user.recieverMessages];
    messages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const users = new Map();

    const messageStatusChange = [];

    messages.forEach((msg) => {
      const isSender = msg.senderId === userId;
      const calculatedId = isSender ? msg.recieverId : msg.senderId;
      if (msg.messageStatus === "sent") {
        messageStatusChange.push(msg.id);
      }
      const {
        id,
        type,
        message,
        messageStatus,
        createdAt,
        senderId,
        recieverId,
      } = msg;
      if (!users.get(calculatedId)) {
        let user = {
          messageId: id,
          type,
          message,
          messageStatus,
          createdAt,
          senderId,
          recieverId,
        };
        if (isSender) {
          user = {
            ...user,
            ...msg.reciever,
            totalUnreadMessages: 0,
          };
        } else {
          user = {
            ...user,
            ...msg.sender,
            totalUnreadMessages: messageStatus !== "read" ? 1 : 0,
          };
        }
        users.set(calculatedId, { ...user });
      } else if (messageStatus !== "read" && !isSender) {
        const user = users.get(calculatedId);
        users.set(calculatedId, {
          ...user,
          totalUnreadMessages: user.totalUnreadMessages + 1,
        });
      }
    });

    // console.log(messageStatusChange);

    if (messageStatusChange.length > 0) {
      await prisma.messages.updateMany({
        where: {
          id: { in: messageStatusChange },
        },
        data: {
          messageStatus: "delivered",
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        users: Array.from(users.values()),
        onlineUser: Array.from(onlineUser.keys()),
      },
    });
  } catch (err) {
    next(err);
  }
};