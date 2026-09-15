import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react'
import { useProjects } from '@/hooks/useProjects'
import { useTasks } from '@/hooks/useTasks'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { TaskCard } from '@/components/features/TaskCard'
import { QuickAddTask } from '@/components/features/QuickAddTask'
import type { ProjectStatus, Task } from '@/types'
import { cn } from '@/utils/cn'

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'just_started', label: 'Just started' },
  { value: 'making_progress', label: 'Making progress' },
  { value: 'almost_there', label: 'Almost there' },
  { value: 'done', label: 'Done' },
]

export function ProjectDetail() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { projects, updateProject, updateProjectStatus, removeProject } = useProjects()
  const { tasks, completeTask, uncompleteTask, skipTask, removeTask } = useTasks()
  const [addOpen, setAddOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')

  const project = projects.find((p) => p.id === projectId)
  const projectTasks = tasks.filter((t) => t.projectId === projectId && t.status === 'active')
  const completedTasks = tasks
    .filter((t) => t.projectId === projectId && t.status === 'done')
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))

  if (!project) {
    return <EmptyState title="Project not found." />
  }

  function handleDeleteProject() {
    if (!project) return
    if (window.confirm(`Delete "${project.name}"? This can't be undone.`)) {
      removeProject(project.id)
      navigate('/projects')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <button
        onClick={() => navigate('/projects')}
        className="flex items-center gap-1.5 text-sm font-medium text-ink-faint hover:text-ink-soft"
      >
        <ArrowLeft size={16} /> Projects
      </button>

      <div>
        {editingName ? (
          <div className="flex items-center gap-2">
            <Input
              autoFocus
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="h-11 text-[22px] font-bold sm:text-[26px]"
            />
            <Button
              size="sm"
              onClick={() => {
                if (nameInput.trim()) updateProject(project.id, { name: nameInput.trim() })
                setEditingName(false)
              }}
            >
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditingName(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setNameInput(project.name)
                setEditingName(true)
              }}
              className="group flex items-center gap-2"
            >
              <h1 className="text-[28px] font-bold text-ink sm:text-[32px]">{project.name}</h1>
              <Pencil size={16} className="text-ink-faint opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
            <button
              onClick={handleDeleteProject}
              aria-label={`Delete ${project.name}`}
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink-faint hover:bg-soft hover:text-error"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateProjectStatus(project.id, opt.value)}
              className={cn(
                'rounded-full border border-border px-3.5 py-1.5 text-sm font-medium text-ink-soft transition-colors duration-200',
                project.status === opt.value && 'border-primary bg-sage-soft text-primary',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {projectTasks.length === 0 ? (
        <EmptyState title="No tasks yet." subtitle="Add the first task for this project." />
      ) : (
        <div className="flex flex-col gap-2">
          {projectTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onComplete={() => completeTask(task.id)}
              onSkip={() => skipTask(task.id, 'not_today')}
              onClick={() => setEditingTask(task)}
              onRemove={() => removeTask(task.id)}
            />
          ))}
        </div>
      )}

      <button
        onClick={() => setAddOpen(true)}
        className="flex items-center justify-center gap-2 rounded-[var(--radius-card)] border border-dashed border-border py-3.5 text-[15px] font-medium text-ink-faint hover:text-ink-soft"
      >
        <Plus size={18} /> Add a task
      </button>

      {completedTasks.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-[15px] font-semibold text-ink-soft">Completed ({completedTasks.length})</h2>
          {completedTasks.map((task) => (
            <TaskCard key={task.id} task={task} completed onComplete={() => uncompleteTask(task.id)} />
          ))}
        </div>
      )}

      <QuickAddTask
        open={addOpen || Boolean(editingTask)}
        task={editingTask}
        onClose={() => {
          setAddOpen(false)
          setEditingTask(null)
        }}
        defaultProjectId={project.id}
      />
    </div>
  )
}
