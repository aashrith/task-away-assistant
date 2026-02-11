import type React from 'react'
import type { Task } from '../../domain/task/task'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { cn } from '@/lib/utils'

type TasksPanelProps = {
  tasks: Task[]
  activeFilter: 'all' | 'overdue' | 'high'
  onFilterChange: (filter: 'all' | 'overdue' | 'high') => void
}

export function TasksPanel({
  tasks,
  activeFilter,
  onFilterChange,
}: TasksPanelProps): React.JSX.Element {
  const hasTasks = tasks.length > 0

  return (
    <section
      aria-label="Tasks system state"
      className="app-layout__column app-layout__column--tasks"
    >
      <header className="panel-header">Tasks</header>
      <div className="panel-body">
        <div className="tasks-list">
          {hasTasks ? (
            tasks.map((task) => {
              const isCompleted = task.status === 'completed'
              const titleClass = isCompleted
                ? 'task-card__title task-card__title--completed'
                : 'task-card__title'

              return (
                <div
                  key={task.id}
                  className={`task-card ${isCompleted ? 'task-card--completed' : ''}`}
                >
                  <div className="task-card__content">
                    <div className={titleClass}>{task.title}</div>
                    {task.dueDate && (
                      <div className="task-card__meta">
                        Due: {new Date(task.dueDate).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    )}
                    {task.priority && (
                      <div className="task-card__priority">
                        <span
                          className={`task-card__priority-dot task-card__priority-dot--${task.priority}`}
                        />
                        <span className="task-card__priority-label">
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="tasks-empty">
              No tasks yet. Use the chat to add one.
            </div>
          )}
        </div>

        <div className="tasks-filters">
          <div className="tasks-filters__label">Filters:</div>
          <ButtonGroup orientation="vertical" className="w-full">
            {(['all', 'overdue', 'high'] as const).map((filter) => (
              <Button
                key={filter}
                variant="ghost"
                size="sm"
                onClick={() => onFilterChange(filter)}
                data-active={activeFilter === filter ? 'true' : 'false'}
                className={cn(
                  'w-full justify-start font-normal',
                  activeFilter === filter && 'bg-accent/10 text-accent'
                )}
              >
                {filter === 'all' ? 'All' : filter === 'overdue' ? 'Overdue' : 'High Priority'}
              </Button>
            ))}
          </ButtonGroup>
        </div>
      </div>
    </section>
  )
}
