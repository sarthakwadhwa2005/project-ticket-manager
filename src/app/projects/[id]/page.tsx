'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useProject } from '@/hooks/useProjects';
import { useTickets } from '@/hooks/useTickets';
import { useRepoInsights } from '@/hooks/useGithub';
import { ErrorState, LoadingCards, PageShell, priorityLabels, statusLabels, TicketModal, type TicketFormValue } from '@/components/app-ui';

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const project = useProject(id);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [ticketModal, setTicketModal] = useState<TicketFormValue | 'new' | null>(null);
  useEffect(() => { const timer = window.setTimeout(() => setDebouncedSearch(search), 300); return () => window.clearTimeout(timer); }, [search]);
  const tickets = useTickets({ projectId: id, q: debouncedSearch || undefined, status: (status || undefined) as 'TODO' | 'IN_PROGRESS' | 'DONE' | undefined, priority: (priority || undefined) as 'LOW' | 'MEDIUM' | 'HIGH' | undefined, page: 1, limit: 100 });
  const repoInsights = useRepoInsights(project.data?.repo ? id : '');
  if (project.isLoading) return <PageShell><LoadingCards /></PageShell>;
  if (project.isError || !project.data) return <PageShell><ErrorState message={project.error?.message ?? 'Project not found'} retry={() => project.refetch()} /></PageShell>;
  const data = project.data;
  return <PageShell>
    <Link href="/" className="text-sm font-semibold text-blue-700 hover:underline">← All projects</Link>
    <header className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h1 className="text-3xl font-bold">{data.name}</h1><p className="mt-2 max-w-2xl text-slate-600">{data.description}</p></div><button onClick={() => setTicketModal('new')} className="rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700">+ New ticket</button></header>
    <div className="mt-6 grid grid-cols-3 gap-3 sm:max-w-xl">{(['TODO', 'IN_PROGRESS', 'DONE'] as const).map((key) => <div key={key} className="rounded-xl bg-white p-4 text-center shadow-sm ring-1 ring-slate-200"><div className="text-2xl font-bold">{data.ticketCounts[key]}</div><div className="text-sm text-slate-500">{statusLabels[key]}</div></div>)}</div>
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"><div className="flex flex-col gap-3 lg:flex-row"><label className="sr-only" htmlFor="ticket-search">Search tickets</label><input id="ticket-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title or description…" className="flex-1 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500" /><label className="sr-only" htmlFor="ticket-status">Filter by status</label><select id="ticket-status" aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2"><option value="">All statuses</option>{Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><label className="sr-only" htmlFor="ticket-priority">Filter by priority</label><select id="ticket-priority" aria-label="Filter by priority" value={priority} onChange={(event) => setPriority(event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2"><option value="">All priorities</option>{Object.entries(priorityLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
      {tickets.isLoading && <div className="mt-6 h-32 animate-pulse rounded-lg bg-slate-100" />}{tickets.isError && <div className="mt-6"><ErrorState message={tickets.error.message} retry={() => tickets.refetch()} /></div>}{tickets.isSuccess && tickets.data.tickets.length === 0 && <p className="py-12 text-center text-slate-500">{search || status || priority ? 'No tickets match these filters.' : 'No tickets yet.'}</p>}{tickets.isSuccess && tickets.data.tickets.length > 0 && <div className="mt-5 divide-y divide-slate-100">{tickets.data.tickets.map((ticket) => <button key={ticket.id} onClick={() => setTicketModal(ticket)} className="flex w-full items-center justify-between gap-4 py-4 text-left hover:bg-slate-50"><span className="min-w-0"><span className="block truncate font-semibold">{ticket.title}</span><span className="mt-1 block truncate text-sm text-slate-500">{ticket.description || 'No description'}</span></span><span className="shrink-0 text-right text-xs text-slate-500"><span className="block">{statusLabels[ticket.status]}</span><span className="mt-1 block">{priorityLabels[ticket.priority]}</span></span></button>)}</div>}
    </section>
    {data.repo && <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start"><div><h2 className="font-semibold">Repository Insights</h2><p className="mt-1 text-sm text-slate-500">{data.repo}</p></div>{repoInsights.data && <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${repoInsights.data.cached ? 'bg-slate-100 text-slate-700' : 'bg-emerald-100 text-emerald-700'}`}>{repoInsights.data.cached ? 'Cached' : 'Fresh'}</span>}</div>
      {repoInsights.isLoading && <div className="mt-5 h-24 animate-pulse rounded-lg bg-slate-100" />}
      {repoInsights.isError && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"><p>{repoInsights.error.message}</p><button onClick={() => repoInsights.refetch()} className="mt-2 font-semibold underline">Try again</button></div>}
      {repoInsights.data && <><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3"><Metric label="Stars" value={repoInsights.data.stars.toLocaleString()} /><Metric label="Forks" value={repoInsights.data.forks.toLocaleString()} /><Metric label="Open issues" value={repoInsights.data.openIssues.toLocaleString()} /><Metric label="Watchers" value={repoInsights.data.watchers.toLocaleString()} /><Metric label="Language" value={repoInsights.data.language ?? 'Not specified'} /><Metric label="License" value={repoInsights.data.license ?? 'Not specified'} /></div><p className="mt-4 text-xs text-slate-500">Fetched {new Date(repoInsights.data.fetchedAt).toLocaleString()}{repoInsights.data.stale ? ' · Showing stale data' : ''}</p></>}
    </section>}
    {ticketModal && <TicketModal projectId={id} ticket={ticketModal === 'new' ? undefined : ticketModal} onClose={() => setTicketModal(null)} />}
  </PageShell>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-slate-50 p-3"><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 truncate font-semibold">{value}</dd></div>;
}
