import mongoose from "mongoose";

interface iDatabase {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  connectionStatus(): boolean;
}
export class Database implements iDatabase {
  private _connectionStatus: boolean = false;
  private _db_URI: string;

  public constructor(dbURI: string) {
    this._db_URI = dbURI;
  }
  public async connect(): Promise<void> {
    if (!this.connectionStatus()) {
      await mongoose.connect(this._db_URI);
      console.log("Database connected");
      this.setConnectionStatus(true);

      this.setupEventListeners();
    } else console.log("Database already connected");
  }
  public async disconnect(): Promise<void> {
    if (this.connectionStatus()) {
      await mongoose.connection.close();
      this.setConnectionStatus(false);
      console.log("database connection closed");
    }
  }
  public connectionStatus(): boolean {
    return this._connectionStatus;
  }

  private setupEventListeners(): void {
    mongoose.connection.on("error", (err: any): void => {
      console.log("error: ", err.message);
    });
    mongoose.connection.on("disconnect", (): void => {
      console.log("The database disconnected");
    });
    mongoose.connection.on("connected", (): void => {
      console.log("The database connected");
    });
  }
  private setConnectionStatus(set: boolean): void {
    this._connectionStatus = set;
  }
}
