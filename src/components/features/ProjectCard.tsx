import type { MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { StatusProgress } from '@/components/ui/ProgressBar'
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
  function handleRemove(e: MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (window.confirm(`Delete "${project.name}"? This can't be undone.`)) onRemove()
  }

  return (
    <Link to={`/projects/${project.id}`}>
      <Card className="relative transition-colors duration-200 hover:border-primary">
        <button
          onClick={handleRemove}
          aria-label={`Delete ${project.name}`}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-ink-faint hover:bg-soft hover:text-error"
        >
          <Trash2 size={16} />
        </button>

        <p className="pr-8 text-[17px] font-semibold text-ink">{project.name}</p>
        <p className="mt-0.5 text-sm text-ink-faint">
          {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
        </p>
        <StatusProgress status={project.status} className="mt-3" />
      </Card>
    </Link>
  )
}
