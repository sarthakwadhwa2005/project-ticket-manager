'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { ErrorState, LoadingCards, PageShell, priorityLabels, ProjectModal, statusLabels, TicketModal } from '@/components/app-ui';

export default function Home() {
  const projects = useProjects();
  const [showProject, setShowProject] = useState(false);
  const [ticketProjectId, setTicketProjectId] = useState<string | null>(null);
  return <PageShell>
    <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold uppercase tracking-widest text-blue-600">Project manager</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Your projects</h1><p className="mt-2 text-slate-600">Keep work moving with a clear view of every ticket.</p></div><button onClick={() => setShowProject(true)} className="rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700">+ New project</button></header>
    {projects.isLoading && <LoadingCards />}
    {projects.isError && <ErrorState message={projects.error.message} retry={() => projects.refetch()} />}
    {projects.isSuccess && projects.data.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center"><h2 className="text-xl font-semibold">No projects yet</h2><p className="mt-2 text-slate-600">Create your first project to get started.</p></div>}
    {projects.isSuccess && projects.data.length > 0 && <div className="grid gap-6 md:grid-cols-2">{projects.data.map((project) => <article key={project.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-semibold">{project.name}</h2><p className="mt-1 text-sm text-slate-600">{project.description}</p></div><button onClick={() => setTicketProjectId(project.id)} className="rounded-full bg-blue-50 px-3 py-1 text-lg font-medium text-blue-700 hover:bg-blue-100" aria-label={`Add ticket to ${project.name}`}>+</button></div>
      <div className="mt-5 grid grid-cols-3 gap-2">{(['TODO', 'IN_PROGRESS', 'DONE'] as const).map((status) => <div key={status} className="rounded-lg bg-slate-50 p-3 text-center"><div className="text-lg font-bold">{project.ticketCounts[status]}</div><div className="text-xs text-slate-500">{statusLabels[status]}</div></div>)}</div>
      <div className="mt-5"><h3 className="text-sm font-semibold text-slate-700">Recent tickets</h3><ul className="mt-2 divide-y divide-slate-100">{project.recentTickets.map((ticket) => <li key={ticket.id} className="flex items-center justify-between gap-3 py-2 text-sm"><span className="truncate">{ticket.title}</span><span className="shrink-0 text-xs text-slate-500">{priorityLabels[ticket.priority as keyof typeof priorityLabels]}</span></li>)}</ul></div>
      <Link href={`/projects/${project.id}`} className="mt-5 inline-block text-sm font-semibold text-blue-700 hover:underline">Open project →</Link>
    </article>)}</div>}
    {showProject && <ProjectModal onClose={() => setShowProject(false)} />}
    {ticketProjectId && <TicketModal projectId={ticketProjectId} onClose={() => setTicketProjectId(null)} />}
  </PageShell>;
}
