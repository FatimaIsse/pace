import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react'
import { useProjects } from '@/hooks/useProjects'
import { useTasks } from '@/hooks/useTasks'
import { useCheckIn } from '@/hooks/useCheckIn'
import { useUI } from '@/context/UIContext'
import { usePreferences } from '@/context/PreferencesContext'
import { applyCapacityPreferences, normalizeTaskPriority, PRIORITY_LABEL, pickNextProjectStep } from '@/services/planning'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { OverflowMenu } from '@/components/ui/OverflowMenu'
import { PriorityDot } from '@/components/ui/PriorityDot'
import { PrimaryTaskCard } from '@/components/features/PrimaryTaskCard'
import { TaskCard } from '@/components/features/TaskCard'
import { QuickAddTask } from '@/components/features/QuickAddTask'
import type { ProjectStatus, Task, TaskPriority } from '@/types'
import { cn } from '@/utils/cn'

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'just_started', label: 'Just started' },
  { value: 'making_progress', label: 'Making progress' },
  { value: 'almost_there', label: 'Almost there' },
  { value: 'done', label: 'Done' },
]

const PRIORITY_OPTIONS: TaskPriority[] = ['could', 'should', 'must']

export function ProjectDetail() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { projects, updateProject, updateProjectStatus, removeProject } = useProjects()
  const { tasks, addTask, completeTask, uncompleteTask, skipTask, updateTask, removeTask } = useTasks()
  const { todayCheckIn } = useCheckIn()
  const { startFocus } = useUI()
  const { planningStyle, dailyCapacityPref } = usePreferences()
  const [addOpen, setAddOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [creatingStep, setCreatingStep] = useState(false)

  const project = projects.find((p) => p.id === projectId)
  const projectTasks = tasks.filter((t) => t.projectId === projectId && t.status === 'active')
  const completedTasks = tasks
    .filter((t) => t.projectId === projectId && t.status === 'done')
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))

  if (!project) {
    return <EmptyState title="Project not found." />
  }

  const capacity = applyCapacityPreferences(todayCheckIn?.energy ?? 'okay', todayCheckIn?.dayLoad ?? 'normal', {
    planningStyle,
    dailyCapacityPref,
  })
  const suggestion = pickNextProjectStep(projectTasks, project.name, capacity)
  const nextStepTask = 'task' in suggestion ? suggestion.task : null
  const remaining = projectTasks.filter((t) => t.id !== nextStepTask?.id)

  async function handleMoveForward() {
    if (nextStepTask) return // already have a real next step, nothing to create
    if (!('newStep' in suggestion)) return
    setCreatingStep(true)
    await addTask({
      title: suggestion.newStep.title,
      duration: suggestion.newStep.duration,
      projectId: project!.id,
      source: 'breakdown',
    })
    setCreatingStep(false)
  }

  function handleDeleteProject() {
    if (!project) return
    if (window.confirm(`Delete "${project.name}"? This can't be undone.`)) {
      removeProject(project.id)
      navigate('/projects')
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[880px] flex-col gap-6">
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
            <OverflowMenu
              label={`More options for ${project.name}`}
              items={[
                {
                  label: 'Rename',
                  icon: <Pencil size={15} />,
                  onClick: () => {
                    setNameInput(project.name)
                    setEditingName(true)
                  },
                },
                { label: 'Delete', icon: <Trash2 size={15} />, onClick: handleDeleteProject, variant: 'danger' },
              ]}
            />
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateProjectStatus(project.id, opt.value)}
              className={cn(
                'rounded-full border border-border px-3.5 py-1.5 text-sm font-medium text-ink-soft transition-colors duration-200',
                project.status === opt.value && 'border-primary-text bg-sage-soft text-primary-text',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          {PRIORITY_OPTIONS.map((p) => (
            <button
              key={p}
              onClick={() => updateProject(project.id, { priority: p })}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-sm font-medium text-ink-soft transition-colors duration-200',
                normalizeTaskPriority(project.priority) === p && 'border-primary-text bg-sage-soft text-primary-text',
              )}
            >
              <PriorityDot priority={p} />
              {PRIORITY_LABEL[p]}
            </button>
          ))}
        </div>
      </div>

      {nextStepTask ? (
        <PrimaryTaskCard
          task={nextStepTask}
          eyebrow="Next step"
          capacity={capacity}
          allTasks={tasks}
          projects={projects}
          onStart={() => startFocus(nextStepTask)}
          onSkip={() => skipTask(nextStepTask.id, 'not_today')}
          onEdit={() => setEditingTask(nextStepTask)}
          onMove={() => updateTask(nextStepTask.id, { scheduledFor: null })}
          onRemove={() => removeTask(nextStepTask.id)}
        />
      ) : (
        <EmptyState
          title="No tasks yet."
          subtitle="Add the first task for this project, or let Pace suggest a small one."
        />
      )}

      {!nextStepTask && 'newStep' in suggestion && (
        <button
          onClick={handleMoveForward}
          disabled={creatingStep}
          className="self-start text-sm font-medium text-primary-text hover:underline"
        >
          Help me move this forward — {suggestion.newStep.title} ({suggestion.newStep.duration} min)
        </button>
      )}

      {remaining.length > 0 && (
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setShowAll((v) => !v)}
            className="flex items-center gap-1 self-start text-sm font-medium text-ink-faint hover:text-ink-soft"
          >
            {remaining.length} thing{remaining.length === 1 ? '' : 's'} waiting quietly
            {showAll ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </button>
          {showAll && (
            <div className="animate-card-in flex flex-col gap-2">
              {remaining.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onComplete={() => completeTask(task.id)}
                  onSkip={() => skipTask(task.id, 'not_today')}
                  onClick={() => setEditingTask(task)}
                  onMove={() => updateTask(task.id, { scheduledFor: null })}
                  onRemove={() => removeTask(task.id)}
                />
              ))}
            </div>
          )}
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
            <TaskCard
              key={task.id}
              task={task}
              completed
              onComplete={() => uncompleteTask(task.id)}
              onRemove={() => removeTask(task.id)}
            />
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
