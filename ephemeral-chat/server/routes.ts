import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { setupAuth, hashPassword } from "./auth";
import { z } from "zod";
import passport from "passport";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  app.post(api.auth.register.path, async (req, res) => {
    try {
      const input = api.auth.register.input.parse(req.body);
      const existingUser = await storage.getUserByUsername(input.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const existingEmail = await storage.getUserByEmail(input.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const hashedPassword = await hashPassword(input.password);
      const user = await storage.createUser({ ...input, password: hashedPassword });
      
      req.login(user, (err) => {
        if (err) return res.status(500).json({ message: "Login failed after register" });
        const { password, ...userResponse } = user;
        res.status(201).json(userResponse);
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.auth.login.path, (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "Invalid username or password" });
      if (user.isBanned) return res.status(401).json({ message: "You are banned" });
      
      req.login(user, (err: any) => {
        if (err) return next(err);
        const { password, ...userResponse } = user;
        res.status(200).json(userResponse);
      });
    })(req, res, next);
  });

  app.post(api.auth.logout.path, (req, res) => {
    req.logout((err) => {
      if (err) return res.status(500).json({ message: "Logout failed" });
      res.status(200).json({ message: "Logged out" });
    });
  });

  app.get(api.auth.me.path, (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    const { password, ...userResponse } = req.user as any;
    res.status(200).json(userResponse);
  });

  app.get(api.users.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    const users = await storage.getAllUsers();
    const safeUsers = users.map(u => {
      const { password, ...safe } = u;
      return safe;
    });
    res.json(safeUsers);
  });

  app.post(api.users.ban.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    const me = req.user as any;
    if (me.email !== 'arduinodebugstick@outlook.com') {
      return res.status(401).json({ message: "Not authorized" });
    }
    const targetId = Number(req.params.id);
    await storage.updateUser(targetId, { isBanned: true });
    res.json({ message: "User banned" });
  });

  app.post(api.groups.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    try {
      const input = api.groups.create.input.parse(req.body);
      const group = await storage.createGroup({ name: input.name, creatorId: (req.user as any).id }, input.memberIds);
      // Hack: res.status(201) needs group with members object according to schema
      res.status(201).json(group as any);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.get(api.groups.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    const groups = await storage.getGroups();
    res.json(groups);
  });

  app.get(api.messages.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    const input = api.messages.list.input?.safeParse(req.query);
    if (!input || !input.success) return res.status(400).json({ message: "Invalid query params" });

    const { userId, groupId } = input.data || {};
    const currentUserId = (req.user as any).id;

    const messages = await storage.getMessages(currentUserId, userId, groupId);
    res.json(messages);
  });

  app.post(api.messages.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    try {
      const input = api.messages.create.input.parse(req.body);
      const msg = await storage.createMessage({
        ...input,
        senderId: (req.user as any).id,
      });
      res.status(201).json(msg);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.get(api.messages.download.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    const input = api.messages.download.input?.safeParse(req.query);
    const { userId, groupId } = input?.data || {};
    const currentUserId = (req.user as any).id;

    const messages = await storage.getMessages(currentUserId, userId, groupId);
    const textContent = messages.map(m => `[${new Date(m.createdAt || '').toLocaleString()}] ${m.sender.username}: ${m.content}`).join('\n');
    
    res.setHeader('Content-disposition', 'attachment; filename=chat-history.txt');
    res.setHeader('Content-type', 'text/plain');
    res.send(textContent);
  });

  // Seed db with admin user if needed
  await seedDatabase();

  return httpServer;
}

export async function seedDatabase() {
  const existingAdmin = await storage.getUserByEmail('arduinodebugstick@outlook.com');
  if (!existingAdmin) {
    const hashedPassword = await hashPassword('ADMIN321');
    await storage.createUser({
      username: 'admin',
      email: 'arduinodebugstick@outlook.com',
      password: hashedPassword,
    });
  }
}
