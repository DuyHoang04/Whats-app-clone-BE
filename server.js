import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes/index.js";
import morgan from "morgan";
import { Server } from "socket.io";
import bodyParser from "body-parser";
import { multerCloudinaryMiddleware } from "./middlewares/fileUpload.js";

dotenv.config();
const app = express();
app.use(morgan("common"));

const PORT = process.env.PORT || 8080;

app.use(cors());
// app.use(express.json());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// app.use(express.static("public"));
app.use(multerCloudinaryMiddleware);

app.use(routes);

const server = app.listen(PORT, () => {
  console.log(`SERVER STARTED ON PORT ${PORT}`);
});

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
  },
});

global.onlineUser = new Map();
io.on("connection", (socket) => {
  global.chatSocket = socket;
  socket.on("add-user", (userId) => {
    onlineUser.set(userId, socket.id);
  });
  socket.on("send-msg", (data) => {
    const sendUserSocket = onlineUser.get(data.to);
    if (sendUserSocket) {
      io.to(sendUserSocket).emit("msg-recieve", {
        to: data.from,
        from: data.to,
      });
    }
  });
  socket.on("outgoing-voice-call", (data) => {
    const sendUserSocket = onlineUser.get(data.to);
    const { from, roomId, callType } = data;
    if (sendUserSocket) {
      io.to(sendUserSocket).emit("incoming-voice-call", {
        from,
        roomId,
        callType,
      });
    }
  });

  socket.on("outgoing-video-call", (data) => {
    const sendUserSocket = onlineUser.get(data.to);
    const { from, roomId, callType } = data;
    if (sendUserSocket) {
      io.to(sendUserSocket).emit("incoming-video-call", {
        from,
        roomId,
        callType,
      });
    }
  });

  socket.on("reject-voice-call", (data) => {
    const sendUserSocket = onlineUser.get(data.to);
    if (sendUserSocket) {
      io.to(sendUserSocket).emit("voice-call-rejected");
    }
  });

  socket.on("reject-video-call", (data) => {
    const sendUserSocket = onlineUser.get(data.to);
    if (sendUserSocket) {
      io.to(sendUserSocket).emit("video-call-rejected");
    }
  });

  socket.on("accept-incoming-call", (data) => {
    const sendUserSocket = onlineUser.get(data.id);
    if (sendUserSocket) {
      io.to(sendUserSocket).emit("accept-call", { roomId: data.roomId });
    }
  });

  socket.on("end-call-video", ({ id }) => {
    const sendUserSocket = onlineUser.get(id);
    if (sendUserSocket) {
      io.to(sendUserSocket).emit("end-call");
    }
  });
  socket.on("end-call-voice", ({ id }) => {
    const sendUserSocket = onlineUser.get(id);
    if (sendUserSocket) {
      io.to(sendUserSocket).emit("end-call");
    }
  });
  socket.on("signout", (data) => {
    onlineUser.delete(data);
    socket.broadcast.emit("online-user", {
      onlineUser: Array.from(onlineUser.keys()),
    });
  });
});
