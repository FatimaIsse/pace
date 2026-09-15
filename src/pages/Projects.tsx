import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useProjects } from '@/hooks/useProjects'
import { useTasks } from '@/hooks/useTasks'
import { useBrainDump } from '@/hooks/useBrainDump'
import { EmptyState } from '@/components/ui/EmptyState'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ProjectCard } from '@/components/features/ProjectCard'
import type { InboxRouteState } from '@/components/features/InboxSheet'

export function Projects() {
  const { projects, addProject, removeProject } = useProjects()
  const { tasks } = useTasks()
  const { removeInboxItem } = useBrainDump()
  const location = useLocation()
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
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
    setInboxPrefill(null)
  }

  async function handleAdd() {
    if (!name.trim()) return
    await addProject(name.trim())
    if (inboxPrefill) await removeInboxItem(inboxPrefill.dumpId, inboxPrefill.key)
    setName('')
    setCreating(false)
    setInboxPrefill(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-[28px] font-bold text-ink sm:text-[32px]">Projects</h1>

      {activeProjects.length === 0 && !creating && (
        <EmptyState title="No projects yet." subtitle="Group related tasks under one place." />
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
        <button
          onClick={() => setCreating(true)}
          className="flex items-center justify-center gap-2 rounded-[var(--radius-card)] border border-dashed border-border py-3.5 text-[15px] font-medium text-ink-faint hover:text-ink-soft"
        >
          <Plus size={18} /> Add a project
        </button>
      )}
    </div>
  )
}
