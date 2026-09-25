import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { StatusProgress } from '@/components/ui/ProgressBar'
import { OverflowMenu, type OverflowMenuItem } from '@/components/ui/OverflowMenu'
import { PriorityDot } from '@/components/ui/PriorityDot'
import { normalizeTaskPriority, PRIORITY_LABEL } from '@/services/planning'
import type { Project } from '@/types'

export function ProjectCard({
  project,
  taskCount,
  onRemove,
}: {
  project: Project
  taskCount: number
  onRemove: () => void
}) {
  function handleRemove() {
    if (window.confirm(`Delete "${project.name}"? This can't be undone.`)) onRemove()
  }

  const menuItems: OverflowMenuItem[] = [
    { label: 'Delete', icon: <Trash2 size={15} />, onClick: handleRemove, variant: 'danger' },
  ]

  const priority = normalizeTaskPriority(project.priority)

  return (
    <Link to={`/projects/${project.id}`}>
      <Card className="relative transition-colors duration-200 hover:border-primary-text">
        <div className="absolute right-3 top-3">
          <OverflowMenu items={menuItems} label={`More options for ${project.name}`} />
        </div>

        <p className="pr-8 text-[17px] font-semibold text-ink">{project.name}</p>
        <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-faint">
          <PriorityDot priority={priority} />
          {PRIORITY_LABEL[priority]} · {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
        </p>
        <StatusProgress status={project.status} className="mt-3" />
      </Card>
    </Link>
  )
}
