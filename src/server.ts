import express, { response, type Request, type Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { Database } from "./model/database";
import User from "./model/user.model";
import cors from "cors";
import { log } from "console";

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

app.get("/health", (_req: Request, res: Response): void => {
  res.send("Server running!\n");
});

app.get("/users", async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find({});
    console.log("Getting users from db", users);
    if (users.length > 0)
      users.map((user) => {
        res.send(JSON.stringify(user) + "\n");
      });
    else
      res.send("There isn't users \n");
  } catch (err: any) {
    console.log("Database error: ", err.message);
    res.send("Ups, something went horribly wrong :s\n");
  }
});

app.post("/users", async (req: Request, res: Response): Promise<void> => {
  const user = new User(req.body);
  try {
    await user.save();
    console.log("Saving user into database: ", JSON.stringify(req.body));
    res.send("user saved: " + JSON.stringify(req.body) + `/n`);
  } catch (err: any) {
    console.log("Getting error: ", err.message);
    res.send("Couldn't save user. Try later :(\n");
  }
});

app.post(
  "/echo",
  (req: Request, res: Response): void => {
    const message = req.body.message;
    console.log("server receives:", message);
    console.log('\n');

    res.send(message + '\n');
  });

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
app.post("/api/auth/check", async (_req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findOne({
      name: 'pedro primo'
    });
    res.send(user);
  } catch (err: any) {
    console.log("Getting error: ", err.message);
    res.send("user not logged in:(\n");
  }
});
app.get("/api/auth/check", async (_req: Request, res: Response): Promise<void> => {
  console.log("check auth");
  try {
    const user = await User.findOne({
      name: 'pedro primo'
    });
    //     res.send(user);
    res.send(null);
    console.log("send: ", JSON.stringify(user));
  } catch (err: any) {
    console.log("Getting error: ", err.message);
    res.send("user not logged in:(\n");
  }
});

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


const server = app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

process.on("SIGINT", async (): Promise<void> => {
  console.log("Gracefull shutdown");
  await database.disconnect();
  console.log("closing server");
  server.close();
  process.exit(0);
});
