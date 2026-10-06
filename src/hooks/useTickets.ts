import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { CreateTicketInput, UpdateTicketInput, TicketQuery } from '@/lib/schemas';

interface Ticket {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
  };
}

interface TicketListResponse {
  tickets: Ticket[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Get tickets with filters
export function useTickets(query: TicketQuery) {
  return useQuery({
    queryKey: queryKeys.tickets.list(query),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query.projectId) params.set('projectId', query.projectId);
      if (query.q) params.set('q', query.q);
      if (query.status) params.set('status', query.status);
      if (query.priority) params.set('priority', query.priority);
      params.set('page', String(query.page || 1));
      params.set('limit', String(query.limit || 20));

      const res = await fetch(`/api/tickets?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch tickets');
      return res.json() as Promise<TicketListResponse>;
    },
  });
}

// Get single ticket
export function useTicket(id: string) {
  return useQuery({
    queryKey: queryKeys.tickets.detail(id),
    queryFn: async () => {
      const res = await fetch(`/api/tickets/${id}`);
      if (!res.ok) throw new Error('Failed to fetch ticket');
      const data = await res.json();
      return data.ticket as Ticket;
    },
    enabled: !!id,
  });
}

// Create ticket
export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTicketInput) => {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || 'Failed to create ticket');
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(variables.projectId) });
    },
  });
}

// Update ticket
export function useUpdateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTicketInput }) => {
      const res = await fetch(`/api/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || 'Failed to update ticket');
      }
      return res.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.details() });
      if (result.ticket?.projectId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.projects.detail(result.ticket.projectId),
        });
      }
    },
  });
}

// Delete ticket
export function useDeleteTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tickets/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || 'Failed to delete ticket');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.lists() });
    },
  });
}