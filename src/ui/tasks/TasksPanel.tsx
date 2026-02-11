import type React from 'react'
import type { Task } from '../../domain/task/task'

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
                <article
                  key={task.id}
                  className={`task-card${isCompleted ? ' task-card--completed' : ''}`}
                  aria-label={`Task ${task.title}`}
                >
                  <div className="task-card__checkbox" aria-hidden="true" />
                  <div className={titleClass}>{task.title}</div>
                <div className="task-card__meta">
                  <span>
                    Due:{' '}
                    {task.dueDate
                      ? new Date(task.dueDate).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : '—'}
                  </span>
                  <span className="task-card__priority">
                    <span className="badge-dot" aria-hidden="true" />
                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                  </span>
                </div>
              </article>
              )
            })
          ) : (
            <p className="tasks-empty">No tasks yet. Use the chat to add one.</p>
          )}
        </div>

        <hr className="tasks-divider" />

        <section className="tasks-filters" aria-label="Task filters">
          <div className="tasks-filters__label">Filters:</div>
          <ul className="tasks-filters__list">
            <li className="tasks-filters__item">
              <button
                type="button"
                className={`tasks-filters__item-button${
                  activeFilter === 'all' ? ' tasks-filters__item-button--active' : ''
                }`}
                onClick={() => onFilterChange('all')}
              >
                All
              </button>
            </li>
            <li className="tasks-filters__item">
              <button
                type="button"
                className={`tasks-filters__item-button${
                  activeFilter === 'overdue' ? ' tasks-filters__item-button--active' : ''
                }`}
                onClick={() => onFilterChange('overdue')}
              >
                Overdue
              </button>
            </li>
            <li className="tasks-filters__item">
              <button
                type="button"
                className={`tasks-filters__item-button${
                  activeFilter === 'high' ? ' tasks-filters__item-button--active' : ''
                }`}
                onClick={() => onFilterChange('high')}
              >
                High Priority
              </button>
            </li>
          </ul>
        </section>
      </div>
    </section>
  )
}

