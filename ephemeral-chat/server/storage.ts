import { users, groups, groupMembers, messages, type InsertUser, type User, type InsertGroup, type Group, type InsertGroupMember, type GroupMember, type InsertMessage, type Message } from "@shared/schema";
import { db, pool } from "./db";
import { eq, or, and, ne, desc, asc, isNull } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

const PostgresStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;
  getAllUsers(): Promise<User[]>;

  createGroup(group: InsertGroup, memberIds: number[]): Promise<Group>;
  getGroups(): Promise<(Group & { members: { user: Omit<User, 'password'> }[] })[]>;
  getGroup(id: number): Promise<Group | undefined>;

  createMessage(message: InsertMessage): Promise<Message & { sender: Omit<User, 'password'> }>;
  getMessages(currentUserId: number, otherUserId?: number, groupId?: number): Promise<(Message & { sender: Omit<User, 'password'> })[]>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createGroup(insertGroup: InsertGroup, memberIds: number[]): Promise<Group> {
    return await db.transaction(async (tx) => {
      const [group] = await tx.insert(groups).values(insertGroup).returning();
      if (memberIds.length > 0) {
        const membersData = memberIds.map(userId => ({
          groupId: group.id,
          userId
        }));
        await tx.insert(groupMembers).values(membersData);
      }
      return group;
    });
  }

  async getGroups(): Promise<(Group & { members: { user: Omit<User, 'password'> }[] })[]> {
    const allGroups = await db.query.groups.findMany({
      with: {
        members: {
          with: {
            user: {
              columns: {
                password: false
              }
            }
          }
        }
      }
    });
    return allGroups as any;
  }

  async getGroup(id: number): Promise<Group | undefined> {
    const [group] = await db.select().from(groups).where(eq(groups.id, id));
    return group;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message & { sender: Omit<User, 'password'> }> {
    const [message] = await db.insert(messages).values(insertMessage).returning();
    const [sender] = await db.select().from(users).where(eq(users.id, message.senderId));
    const { password, ...senderWithoutPassword } = sender;
    return { ...message, sender: senderWithoutPassword } as any;
  }

  async getMessages(currentUserId: number, otherUserId?: number, groupId?: number): Promise<(Message & { sender: Omit<User, 'password'> })[]> {
    const conditions = [];
    if (groupId) {
      conditions.push(eq(messages.groupId, groupId));
    } else if (otherUserId) {
      conditions.push(
        and(
          isNull(messages.groupId),
          or(
            and(eq(messages.senderId, currentUserId), eq(messages.receiverId, otherUserId)),
            and(eq(messages.senderId, otherUserId), eq(messages.receiverId, currentUserId))
          )
        )
      );
    } else {
       return [];
    }

    const msgs = await db.query.messages.findMany({
      where: and(...conditions),
      with: {
        sender: {
          columns: {
            password: false
          }
        }
      },
      orderBy: [asc(messages.createdAt)]
    });
    return msgs as any;
  }
}

export const storage = new DatabaseStorage();
