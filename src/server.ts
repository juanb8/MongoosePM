import express, { type Request, type Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { Database } from "./model/database";
import User from "./model/user.model";

const app = express();
app.use(express.json());

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
