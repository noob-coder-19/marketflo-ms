import type { WebSocket } from "ws";
import { User } from "./user";

export class UserManager {
  private users: Map<string, User>;
  private static instance: UserManager | null = null;

  private constructor() {
    this.users = new Map();
  }

  public static getInstance(): UserManager {
    if (!this.instance) {
      this.instance = new UserManager();
    }
    return this.instance;
  }

  public getUser(userId: string): User | undefined {
    return this.users.get(userId);
  }

  public addUser(socketConn: WebSocket): void {
    const userId = UserManager.generateUserId();
    const user = new User(userId, socketConn);

    this.users.set(userId, user);
    this.registerUserLeave(userId);
  }

  private registerUserLeave(userId: string): void {
    const socketConn = this.users.get(userId)?.getWs();
    if (socketConn) {
      socketConn.on("close", () => {
        this.removeUser(userId);
      });
    }
  }

  public removeUser(userId: string): void {
    this.users.delete(userId);
  }

  public static generateUserId(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }
}
