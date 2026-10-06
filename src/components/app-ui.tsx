'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import { useCreateProject } from '@/hooks/useProjects';
import { useCreateTicket, useUpdateTicket } from '@/hooks/useTickets';
import type { CreateProjectInput, CreateTicketInput, UpdateTicketInput } from '@/lib/schemas';

export const statusLabels = { TODO: 'Todo', IN_PROGRESS: 'In Progress', DONE: 'Done' } as const;
export const priorityLabels = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High' } as const;

export function PageShell({ children }: { children: ReactNode }) {
  return <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8"><div className="mx-auto max-w-6xl">{children}</div></main>;
}

export function ErrorState({ message, retry }: { message: string; retry: () => void }) {
  return <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800"><p>{message}</p><button onClick={retry} className="mt-3 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800">Try again</button></div>;
}

export function LoadingCards() {
  return <div className="grid gap-6 md:grid-cols-2"><div className="h-72 animate-pulse rounded-2xl bg-slate-200" /><div className="h-72 animate-pulse rounded-2xl bg-slate-200" /></div>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return <div className="fixed inset-0 z-20 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4" role="dialog" aria-modal="true" aria-label={title}><div className="my-auto max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"><div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-semibold">{title}</h2><button onClick={onClose} className="rounded-md px-2 py-1 text-xl text-slate-500 hover:bg-slate-100" aria-label="Close">×</button></div>{children}</div></div>;
}

export function ProjectModal({ onClose }: { onClose: () => void }) {
  const mutation = useCreateProject();
  const [form, setForm] = useState<CreateProjectInput>({ name: '', description: '', repo: '' });
  const [error, setError] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault(); setError('');
    try { await mutation.mutateAsync({ ...form, repo: form.repo?.trim() || undefined }); onClose(); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to create project'); }
  }
  return <Modal title="New project" onClose={onClose}><form onSubmit={submit} className="space-y-4">
    <Field label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
    <Field label="Description" value={form.description} onChange={(value) => setForm({ ...form, description: value })} required textarea />
    <Field label="GitHub repository (optional)" value={form.repo ?? ''} onChange={(value) => setForm({ ...form, repo: value })} placeholder="owner/repo or https://github.com/owner/repo" />
    {error && <p className="text-sm text-red-700">{error}</p>}<FormActions saving={mutation.isPending} onClose={onClose} label="Create project" />
  </form></Modal>;
}

export interface TicketFormValue { id?: string; title: string; description: string; status: 'TODO' | 'IN_PROGRESS' | 'DONE'; priority: 'LOW' | 'MEDIUM' | 'HIGH'; }

export function TicketModal({ projectId, ticket, onClose }: { projectId: string; ticket?: TicketFormValue; onClose: () => void }) {
  const create = useCreateTicket(); const update = useUpdateTicket(); const editing = Boolean(ticket);
  const [form, setForm] = useState<TicketFormValue>(ticket ?? { title: '', description: '', status: 'TODO', priority: 'MEDIUM' });
  const [error, setError] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault(); setError('');
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }
    try {
      if (editing && ticket?.id) {
        const data: UpdateTicketInput = { title: form.title, description: form.description, status: form.status, priority: form.priority };
        await update.mutateAsync({ id: ticket.id, data });
      } else {
        const data: CreateTicketInput = { projectId, title: form.title, description: form.description, status: form.status, priority: form.priority };
        await create.mutateAsync(data);
      }
      onClose();
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to save ticket'); }
  }
  const saving = create.isPending || update.isPending;
  return <Modal title={editing ? 'Edit ticket' : 'New ticket'} onClose={onClose}><form onSubmit={submit} className="space-y-4">
    <Field label="Title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} />
    <Field label="Description" value={form.description} onChange={(value) => setForm({ ...form, description: value })} textarea />
    <div className="grid gap-4 sm:grid-cols-2"><SelectField label="Status" value={form.status} options={Object.entries(statusLabels)} onChange={(value) => setForm({ ...form, status: value as TicketFormValue['status'] })} /><SelectField label="Priority" value={form.priority} options={Object.entries(priorityLabels)} onChange={(value) => setForm({ ...form, priority: value as TicketFormValue['priority'] })} /></div>
    {error && <p className="text-sm text-red-700">{error}</p>}<FormActions saving={saving} onClose={onClose} label={editing ? 'Save changes' : 'Create ticket'} />
  </form></Modal>;
}

function Field({ label, value, onChange, required, textarea, placeholder }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; textarea?: boolean; placeholder?: string }) {
  const common = { value, onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(event.target.value), required, placeholder, className: 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100' };
  return <label className="block text-sm font-medium text-slate-700">{label}{textarea ? <textarea {...common} rows={4} /> : <input {...common} />}</label>;
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: [string, string][]; onChange: (value: string) => void }) {
  return <label className="block text-sm font-medium text-slate-700">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2">{options.map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select></label>;
}

function FormActions({ saving, onClose, label }: { saving: boolean; onClose: () => void; label: string }) {
  return <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={onClose} disabled={saving} className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50">Cancel</button><button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Saving…' : label}</button></div>;
}
