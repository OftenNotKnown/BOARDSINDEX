import { z } from 'zod';
import { insertUserSchema, insertGroupSchema, insertMessageSchema, users, groups, messages } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  })
};

export const loginSchema = z.object({
  username: z.string(),
  password: z.string()
});

const userResponseSchema = z.custom<Omit<typeof users.$inferSelect, "password">>();
const messageWithUserSchema = z.custom<typeof messages.$inferSelect & { sender: Omit<typeof users.$inferSelect, "password"> }>();
const groupWithMembersSchema = z.custom<typeof groups.$inferSelect & { members: Array<{ user: Omit<typeof users.$inferSelect, "password"> }> }>();

export const api = {
  auth: {
    register: {
      method: 'POST' as const,
      path: '/api/auth/register' as const,
      input: insertUserSchema,
      responses: {
        201: userResponseSchema,
        400: errorSchemas.validation,
      }
    },
    login: {
      method: 'POST' as const,
      path: '/api/auth/login' as const,
      input: loginSchema,
      responses: {
        200: userResponseSchema,
        401: errorSchemas.unauthorized,
      }
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout' as const,
      responses: {
        200: z.object({ message: z.string() }),
      }
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me' as const,
      responses: {
        200: userResponseSchema,
        401: errorSchemas.unauthorized,
      }
    }
  },
  users: {
    list: {
      method: 'GET' as const,
      path: '/api/users' as const,
      responses: {
        200: z.array(userResponseSchema),
      }
    },
    ban: {
      method: 'POST' as const,
      path: '/api/users/:id/ban' as const,
      responses: {
        200: z.object({ message: z.string() }),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      }
    }
  },
  groups: {
    create: {
      method: 'POST' as const,
      path: '/api/groups' as const,
      input: insertGroupSchema.extend({ memberIds: z.array(z.number()) }),
      responses: {
        201: groupWithMembersSchema,
        400: errorSchemas.validation,
      }
    },
    list: {
      method: 'GET' as const,
      path: '/api/groups' as const,
      responses: {
        200: z.array(groupWithMembersSchema),
      }
    }
  },
  messages: {
    list: {
      method: 'GET' as const,
      path: '/api/messages' as const,
      input: z.object({
        userId: z.coerce.number().optional(),
        groupId: z.coerce.number().optional(),
      }).optional(),
      responses: {
        200: z.array(messageWithUserSchema),
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/messages' as const,
      input: insertMessageSchema,
      responses: {
        201: messageWithUserSchema,
      }
    },
    download: {
      method: 'GET' as const,
      path: '/api/messages/download' as const,
      input: z.object({
        userId: z.coerce.number().optional(),
        groupId: z.coerce.number().optional(),
      }).optional(),
      responses: {
        200: z.any(),
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
