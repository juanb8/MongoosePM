import express, { response, type Request, type Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { Database } from "./model/database";
import User from "./model/user.model";
import cors from "cors";

import { createServer } from "http";
import { Server, Socket } from "socket.io";
import type { iUser } from "./interface";
import type { Model } from "mongoose";

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
    res.send(JSON.stringify(req.body));
  } catch (err: any) {
    console.log("Getting error: ", err.message);
    res.status(500).json({
      status: "error",
      message: "Internal server error: try again later"
    });
  }
});

app.get("/api/auth/check", async (_req: Request, res: Response): Promise<void> => {
  console.log("check auth");
  try {
    const user = await User.findOne({
      name: 'pedro primo'
    });
    res.send(user);
    //    res.send(null);
    console.log("send: ", JSON.stringify(user));
  } catch (err: any) {
    console.log("Getting error: ", err.message);
    res.send("user not logged in:(\n");
  }
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



const httpServer = createServer(app);
httpServer.listen(3000, (): void => {
  console.log(`Server listening on port ${port}`);
});

const io = new Server(httpServer, {
  cors: {
    origin: "*",
  }
});

io.on("connection", async (socket: Socket) => {
  console.log("Connection with: ", socket.handshake.query.userId);
  try {
    const users = await User.find({});
    const onlineUsers = users.map((user) => user._id.toString());
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
