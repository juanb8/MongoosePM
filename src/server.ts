import express, { response, text, type Request, type Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { Database } from "./model/database";
import User from "./model/user.model";
import cors from "cors";

import { faker } from "@faker-js/faker";

import { createServer } from "http";
import { Server, Socket } from "socket.io";

const messages = [
  {
    _id: faker.database.mongodbObjectId().toString(),
    senderId: faker.database.mongodbObjectId().toString(),
    receiverId: faker.database.mongodbObjectId().toString(),
    createdAt: (new Date()).toString(),
    text: 'hello\n'
  },
];
const socketMap: Map<string, Socket> = new Map();

const app = express();
const corsOptions = {
  origin: '*', // Allow only your frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true // Required if you use cookies or sessions
};
app.use(express.json());
app.use(cors(corsOptions));

const port = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); // Serve static files from 'public' directory app.use(express.static(path.join(__dirname, "../public"))); app.get("/", (req, res) => { res.sendFile(path.join(__dirname, "../public/index.html")); res.send("Hello, world!");

const dbURI = "mongodb://localhost:27017/mongoosePM";
const database = new Database(dbURI);
database.connect();


// server health routes

app.get("/health", (_req: Request, res: Response): void => {
  res.send("Server running!\n");
});

app.post(
  "/echo",
  (req: Request, res: Response): void => {
    const message = req.body.message;
    console.log("server receives:", message);
    console.log('\n');

    res.send(message + '\n');
  });


// auth routes
app.post("/api/auth/signup", async (req: Request, res: Response): Promise<void> => {
  const user = new User(req.body);
  try {
    await user.save();
    console.log("Saving user into database: ", JSON.stringify(req.body));
    const resUser = await User.findOne({
      email: user.email
    });
    res.send(JSON.stringify(resUser));
  } catch (err: any) {
    console.log("Getting error: ", err.message);
    res.status(500).json({
      status: "error",
      message: "Internal server error: try again later"
    });
  }
});

app.get("/api/auth/check", async (_req: Request, res: Response): Promise<void> => {
  //  try {
  //    const user = await User.findOne({
  //      name: 'pedro primo'
  //    });
  //    res.send(user);
  //    //    res.send(null);
  //    console.log("send: ", JSON.stringify(user));
  //  } catch (err: any) {
  //    console.log("Getting error: ", err.message);
  //    res.send("user not logged in:(\n");
  //  }
  res.status(401).send();
});

app.post(
  "/api/auth/login",
  async (req: Request, res: Response): Promise<void> => {
    console.log(
      "getting login request from: ",
      JSON.stringify(req.body)
    );
    // fail logic
    try {
      // find user in db
      //
      const user = await User.findOne({
        email: req.body.email,
      });
      // if didn't find anything throw
      if (!user)
        throw new Error("not a current user");
      // send user
      console.log("user logged: ", user._id.toString());

      res.send(user);
    } catch (error: any) {
      console.log("couldn't find: ", JSON.stringify(req.body));
      res.status(401).json({
        status: "error",
        message: "Unauthorized user"
      });
    }
  }
);

// message routes

app.get("/api/messages/users",
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const users = await User.find({});
      res.send(users);
    } catch (error) {
      res.status(500).json({
        status: "internal server error",
        message: "try again later"
      });
    }
  }
);

app.get("/api/messages/:userId",
  async (req: Request, res: Response): Promise<void> => {
    console.log("requested messages from: ", req.params.userId);
    res.send(messages);
  }
);

app.post(
  "/api/messages/send/:userId",
  async (req: Request, res: Response): Promise<void> => {
    console.log("Message send to userId: ", req.params.userId);
    console.log("message content: ", JSON.stringify(req.body));
    try {
      const user = await User.findOne({
        _id: req.body.senderId
      });

      const message = {
        _id: faker.database.mongodbObjectId().toString(),
        senderId: user?._id,
        receiverId: req.params.userId,
        text: req.body.text,
        img: req.body.img,
        createdAt: new Date(),
      };
      const socket = socketMap.get(req.params.userId as string);
      socket?.emit("newMessage",
        message
      );
      res.status(200).send(
        message
      );
    } catch (error) {
      res.status(500).send("ups, there's an error");
    }
  }
);

const httpServer = createServer(app);
httpServer.listen(3000, (): void => {
  console.log(`Server listening on port ${port}`);
});

const io = new Server(httpServer, {
  cors: {
    origin: "*",
  }
});

function setSocketMap(userId: string, socket: Socket): void {
  socketMap.set(userId, socket);
}

io.on("connection", async (socket: Socket) => {
  const userId = socket.handshake.query.userId;
  console.log("Connection with: ", userId);
  setSocketMap(userId, socket);
  try {
    //    const users = await User.find({});
    //    const onlineUsers = users.map((user) => user._id.toString());

    const onlineUsers = Array.from(socketMap.keys());
    console.log(
      "Sending online users: ",
      onlineUsers
    );
    socket.emit(
      "getOnlineUsers",
      onlineUsers
    );
  } catch (error) {
    console.error(error);
  }
});

//const server = app.listen(port, () => {
//  console.log(`Example app listening on port ${port}`);
//});

process.on("SIGINT", async (): Promise<void> => {
  console.log("Gracefull shutdown");
  await database.disconnect();
  console.log("closing server");
  httpServer.close();
  process.exit(0);
});
