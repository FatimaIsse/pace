import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useProjects } from '@/hooks/useProjects'
import { useTasks } from '@/hooks/useTasks'
import { useBrainDump } from '@/hooks/useBrainDump'
import { PRIORITY_LABEL } from '@/services/planning'
import { EmptyState } from '@/components/ui/EmptyState'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { PriorityDot } from '@/components/ui/PriorityDot'
import { ProjectCard } from '@/components/features/ProjectCard'
import type { InboxRouteState } from '@/components/features/InboxSheet'
import type { TaskPriority } from '@/types'
import { cn } from '@/utils/cn'

const PRIORITY_OPTIONS: TaskPriority[] = ['could', 'should', 'must']

export function Projects() {
  const { projects, addProject, removeProject } = useProjects()
  const { tasks } = useTasks()
  const { removeInboxItem } = useBrainDump()
  const location = useLocation()
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('should')
  const [inboxPrefill, setInboxPrefill] = useState<{ dumpId: string; key: string } | null>(null)

  const activeProjects = projects.filter((p) => !p.archivedAt)

  useEffect(() => {
    const prefill = (location.state as InboxRouteState | null)?.inboxPrefill
    if (!prefill) return
    setName(prefill.text)
    setInboxPrefill({ dumpId: prefill.dumpId, key: prefill.key })
    setCreating(true)
    navigate(location.pathname, { replace: true, state: {} })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state])

  function cancelCreate() {
    setCreating(false)
    setName('')
    setPriority('should')
    setInboxPrefill(null)
  }

  async function handleAdd() {
    if (!name.trim()) return
    await addProject(name.trim(), priority)
    if (inboxPrefill) await removeInboxItem(inboxPrefill.dumpId, inboxPrefill.key)
    setName('')
    setPriority('should')
    setCreating(false)
    setInboxPrefill(null)
  }

  const isEmpty = activeProjects.length === 0 && !creating

  return (
    <div className="mx-auto flex w-full max-w-[880px] flex-col gap-6">
      <h1 className="text-[28px] font-bold text-ink sm:text-[32px]">Projects</h1>

      {isEmpty && (
        <EmptyState
          title="No projects yet"
          subtitle="Projects are for things that take more than one step — like moving, a portfolio, or planning a trip."
          action={
            <Button size="sm" onClick={() => setCreating(true)}>
              Create your first project
            </Button>
          }
        />
      )}

      <div className="flex flex-col gap-3">
        {activeProjects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            taskCount={tasks.filter((t) => t.projectId === project.id && t.status === 'active').length}
            onRemove={() => removeProject(project.id)}
          />
        ))}
      </div>

      {creating ? (
        <Card className="flex flex-col gap-3">
          <Input label="Project name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          <div>
            <p className="mb-2 text-sm font-medium text-ink">How important is this?</p>
            <div className="flex gap-2">
              {PRIORITY_OPTIONS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-button)] border border-border py-2 text-sm font-medium text-ink-soft transition-colors duration-200',
                    priority === p && 'border-primary-text bg-sage-soft text-primary-text',
                  )}
                >
                  <PriorityDot priority={p} />
                  {PRIORITY_LABEL[p]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={cancelCreate}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleAdd}>
              Save
            </Button>
          </div>
        </Card>
      ) : (
        activeProjects.length > 0 && (
          <button
            onClick={() => setCreating(true)}
            className="flex items-center justify-center gap-2 rounded-[var(--radius-card)] border border-dashed border-border py-3.5 text-[15px] font-medium text-ink-faint hover:text-ink-soft"
          >
            <Plus size={18} /> Add a project
          </button>
        )
      )}
    </div>
  )
}
