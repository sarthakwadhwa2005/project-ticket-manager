import { z } from 'zod';

// Shared Zod schemas for validation

// Ticket Status Enum
export const ticketStatusSchema = z.enum(['TODO', 'IN_PROGRESS', 'DONE']);

// Ticket Priority Enum
export const ticketPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH']);

// Project schemas
export const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().min(1, 'Description is required').max(500, 'Description must be less than 500 characters'),
  repo: z.string()
    .optional()
    .refine(
      (val) => !val || isValidRepo(val),
      { message: 'Invalid GitHub repo format. Use "owner/repo" or a full GitHub URL' }
    ),
});

export const projectParamsSchema = z.object({
  id: z.string().min(1, 'Project ID is required'),
});

// Ticket schemas
export const createTicketSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().max(2000, 'Description must be less than 2000 characters').default(''),
  status: ticketStatusSchema.default('TODO'),
  priority: ticketPrioritySchema.default('MEDIUM'),
});

export const updateTicketSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters').optional(),
  description: z.string().max(2000, 'Description must be less than 2000 characters').optional(),
  status: ticketStatusSchema.optional(),
  priority: ticketPrioritySchema.optional(),
});

export const ticketParamsSchema = z.object({
  id: z.string().min(1, 'Ticket ID is required'),
});

// Ticket query params
export const ticketQuerySchema = z.object({
  projectId: z.string().optional(),
  q: z.string().optional(),
  status: ticketStatusSchema.optional(),
  priority: ticketPrioritySchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// Helper function to validate GitHub repo format
function isValidRepo(repo: string): boolean {
  // Accept full GitHub URL or owner/repo format
  const urlPattern = /^https:\/\/github\.com\/[^\/]+\/[^\/]+$/;
  const shortPattern = /^[^\/]+\/[^\/]+$/;
  return urlPattern.test(repo) || shortPattern.test(repo);
}

// Helper to normalize GitHub repo to owner/repo format
export function normalizeRepo(repo: string): string {
  const urlPattern = /^https:\/\/github\.com\/([^\/]+)\/([^\/]+)$/;
  const match = repo.match(urlPattern);
  if (match) {
    return `${match[1]}/${match[2]}`;
  }
  return repo;
}

// Type exports
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type TicketQuery = z.infer<typeof ticketQuerySchema>;