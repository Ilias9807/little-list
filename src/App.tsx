import { useEffect, useState, type CSSProperties } from "react";
import "./App.css";
import {
  getProjectPalette,
  initialProjects,
  loadProjects,
  saveProjects,
  type Project,
} from "./lib/storage";

function App() {
  const [projects, setProjects] = useState<Project[]>(() => loadProjects());
  const [expandedProjects, setExpandedProjects] = useState<number[]>(() => {
    const stored = loadProjects();
    return stored.map((project) => project.id);
  });
  const [addingProject, setAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [taskDrafts, setTaskDrafts] = useState<Record<number, string>>({});
  const [addingTaskFor, setAddingTaskFor] = useState<number | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [projectNameDraft, setProjectNameDraft] = useState("");
  const [editingTask, setEditingTask] = useState<{ projectId: number; taskId: number } | null>(null);
  const [taskTitleDraft, setTaskTitleDraft] = useState("");
  const [projectBursts, setProjectBursts] = useState<
    Record<number, { id: number; points: Array<{ x: number; y: number }> }>
  >({});

  useEffect(() => {
    saveProjects(projects);
  }, [projects]);

  const toggleProject = (projectId: number) => {
    setExpandedProjects((current) =>
      current.includes(projectId)
        ? current.filter((id) => id !== projectId)
        : [...current, projectId]
    );
  };

  const toggleTask = (projectId: number, taskId: number, input?: HTMLInputElement | null) => {
    const isCompleting =
      projects
        .find((project) => project.id === projectId)
        ?.tasks.find((task) => task.id === taskId)?.completed === false;

    setProjects((currentProjects) =>
      currentProjects.map((project) => {
        if (project.id !== projectId) {
          return project;
        }

        return {
          ...project,
          tasks: project.tasks.map((task) =>
            task.id === taskId ? { ...task, completed: !task.completed } : task
          ),
        };
      })
    );

    if (isCompleting) {
      const burstId = Date.now() + Math.random();
      const burstPoints = (() => {
        const taskRow = input?.closest(".task") as HTMLElement | null;
        const projectCard = input?.closest(".project-card") as HTMLElement | null;

        if (!taskRow || !projectCard) {
          return [
            { x: 18, y: 18 },
            { x: 34, y: 12 },
            { x: 22, y: 34 },
            { x: 130, y: 18 },
            { x: 114, y: 12 },
            { x: 108, y: 34 },
            { x: 18, y: 90 },
            { x: 34, y: 106 },
            { x: 22, y: 78 },
            { x: 130, y: 90 },
            { x: 114, y: 106 },
            { x: 108, y: 78 },
          ];
        }

        const taskRect = taskRow.getBoundingClientRect();
        const cardRect = projectCard.getBoundingClientRect();
        const left = taskRect.left - cardRect.left;
        const top = taskRect.top - cardRect.top;
        const right = left + taskRect.width;
        const bottom = top + taskRect.height;

        return [
          { x: left + 8, y: top + 8 },
          { x: left + 18, y: top + 12 },
          { x: left + 12, y: top + 26 },
          { x: right - 8, y: top + 8 },
          { x: right - 18, y: top + 12 },
          { x: right - 12, y: top + 26 },
          { x: left + 8, y: bottom - 8 },
          { x: left + 18, y: bottom - 12 },
          { x: left + 12, y: bottom - 26 },
          { x: right - 8, y: bottom - 8 },
          { x: right - 18, y: bottom - 12 },
          { x: right - 12, y: bottom - 26 },
        ];
      })();

      setProjectBursts((current) => ({
        ...current,
        [projectId]: { id: burstId, points: burstPoints },
      }));

      window.setTimeout(() => {
        setProjectBursts((current) => {
          const active = current[projectId];
          if (!active || active.id !== burstId) {
            return current;
          }

          const next = { ...current };
          delete next[projectId];
          return next;
        });
      }, 900);
    }
  };

  const addProject = () => {
    const trimmedName = newProjectName.trim();

    if (!trimmedName) {
      setAddingProject(false);
      setNewProjectName("");
      return;
    }

    const nextId = Math.max(0, ...projects.map((project) => project.id)) + 1;

    setProjects((currentProjects) => [
      ...currentProjects,
      {
        id: nextId,
        name: trimmedName,
        tasks: [],
        palette: getProjectPalette(currentProjects.length),
      },
    ]);
    setExpandedProjects((current) => [...current, nextId]);
    setAddingProject(false);
    setNewProjectName("");
  };

  const deleteProject = (projectId: number) => {
    const confirmed = window.confirm("Delete this project?");

    if (!confirmed) {
      return;
    }

    setProjects((currentProjects) =>
      currentProjects.filter((project) => project.id !== projectId)
    );
    setExpandedProjects((current) => current.filter((id) => id !== projectId));
    setAddingTaskFor((current) => (current === projectId ? null : current));
    setTaskDrafts((current) => {
      const nextDrafts = { ...current };
      delete nextDrafts[projectId];
      return nextDrafts;
    });
  };

  const saveProjectName = (projectId: number) => {
    const trimmedName = projectNameDraft.trim();

    if (!trimmedName) {
      setEditingProjectId(null);
      setProjectNameDraft("");
      return;
    }

    setProjects((currentProjects) =>
      currentProjects.map((project) =>
        project.id === projectId ? { ...project, name: trimmedName } : project
      )
    );
    setEditingProjectId(null);
    setProjectNameDraft("");
  };

  const saveTaskTitle = (projectId: number, taskId: number) => {
    const trimmedTitle = taskTitleDraft.trim();

    if (!trimmedTitle) {
      setEditingTask(null);
      setTaskTitleDraft("");
      return;
    }

    setProjects((currentProjects) =>
      currentProjects.map((project) => {
        if (project.id !== projectId) {
          return project;
        }

        return {
          ...project,
          tasks: project.tasks.map((task) =>
            task.id === taskId ? { ...task, title: trimmedTitle } : task
          ),
        };
      })
    );
    setEditingTask(null);
    setTaskTitleDraft("");
  };

  const addTaskToProject = (projectId: number) => {
    const text = (taskDrafts[projectId] ?? "").trim();

    if (!text) {
      setAddingTaskFor(null);
      setTaskDrafts((current) => ({ ...current, [projectId]: "" }));
      return;
    }

    const nextTaskId = Math.max(
      0,
      ...projects.flatMap((project) => project.tasks.map((task) => task.id))
    ) + 1;

    setProjects((currentProjects) =>
      currentProjects.map((project) => {
        if (project.id !== projectId) {
          return project;
        }

        return {
          ...project,
          tasks: [
            ...project.tasks,
            {
              id: nextTaskId,
              title: text,
              completed: false,
            },
          ],
        };
      })
    );

    setTaskDrafts((current) => ({ ...current, [projectId]: "" }));
    setAddingTaskFor(null);
  };

  const deleteTask = (projectId: number, taskId: number) => {
    setProjects((currentProjects) =>
      currentProjects.map((project) => {
        if (project.id !== projectId) {
          return project;
        }

        return {
          ...project,
          tasks: project.tasks.filter((task) => task.id !== taskId),
        };
      })
    );
  };

  const resetAllData = () => {
    const confirmed = window.confirm("Clear all projects and tasks?");

    if (!confirmed) {
      return;
    }

    setProjects(initialProjects);
    setExpandedProjects(initialProjects.map((project) => project.id));
    setAddingProject(false);
    setNewProjectName("");
    setTaskDrafts({});
    setAddingTaskFor(null);
  };

  return (
    <main className="app-shell">
      <span className="background-leaf leaf-one" aria-hidden="true" />
      <span className="background-leaf leaf-two" aria-hidden="true" />
      <span className="background-leaf leaf-three" aria-hidden="true" />

      <header className="app-header">
        <div className="brand-row">
          <div className="brand-block">
            <span className="brand-name">little list</span>
            <span className="brand-tagline">your little place</span>
          </div>

          <div className="header-actions" aria-label="Header actions">
            <button type="button" className="icon-button" aria-label="Search">
              ⌕
            </button>
            <button type="button" className="icon-button" aria-label="Options">
              ☰
            </button>
          </div>
        </div>
      </header>

      <section className="project-list" aria-label="Projects">
        {projects.map((project, index) => {
          const isOpen = expandedProjects.includes(project.id);

          return (
            <article
              className="project-card"
              key={project.id}
              data-palette={project.palette}
              style={{ ["--card-index" as string]: String(index) }}
            >
              <div className="project-header-row">
                {editingProjectId === project.id ? (
                  <div className="project-inline-editor">
                    <input
                      type="text"
                      value={projectNameDraft}
                      onChange={(event) => setProjectNameDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          saveProjectName(project.id);
                        }

                        if (event.key === "Escape") {
                          setEditingProjectId(null);
                          setProjectNameDraft("");
                        }
                      }}
                      autoFocus
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    className="project-header"
                    onClick={() => toggleProject(project.id)}
                    aria-expanded={isOpen}
                  >
                    <span className="project-chevron" aria-hidden="true">
                      {isOpen ? "▾" : "▸"}
                    </span>
                    <span>{project.name}</span>
                    <span className="project-count">{project.tasks.length}</span>
                  </button>
                )}

                <div className="project-action-group">
                  {editingProjectId !== project.id ? (
                    <button
                      type="button"
                      className="project-edit-button"
                      onClick={() => {
                        setEditingProjectId(project.id);
                        setProjectNameDraft(project.name);
                      }}
                      aria-label={`Edit ${project.name}`}
                    >
                      ✎
                    </button>
                  ) : null}

                  <button
                    type="button"
                    className="project-delete-button"
                    onClick={() => deleteProject(project.id)}
                    aria-label={`Delete ${project.name}`}
                  >
                    ×
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="project-body">
                  {projectBursts[project.id] ? (
                    <div className="project-completion-burst" aria-hidden="true">
                      {projectBursts[project.id].points.map((point, index) => {
                        const autumnColors = [
                          "#d77a4d",
                          "#c76845",
                          "#d8a24f",
                          "#a9c778",
                          "#7aa96a",
                          "#d0b563",
                          "#b8714d",
                          "#7d9d5a",
                        ];

                        const cornerSpread = [
                          { x: -24, y: -28 },
                          { x: -16, y: -40 },
                          { x: 24, y: -28 },
                          { x: 16, y: -40 },
                          { x: -24, y: 28 },
                          { x: -16, y: 40 },
                          { x: 24, y: 28 },
                          { x: 16, y: 40 },
                          { x: -30, y: -18 },
                          { x: 30, y: -18 },
                          { x: -30, y: 18 },
                          { x: 30, y: 18 },
                        ];

                        const spread = cornerSpread[index % cornerSpread.length];
                        const style = {
                          ["--dx" as string]: `${spread.x}px`,
                          ["--dy" as string]: `${spread.y}px`,
                          ["--rotate" as string]: `${-100 + index * 22}deg`,
                          ["--delay" as string]: `${index * 28}ms`,
                          ["--leaf-color" as string]: autumnColors[index % autumnColors.length],
                          ["--leaf-size" as string]: `${9 + (index % 2) * 3}px`,
                          ["--origin-x" as string]: `${point.x}px`,
                          ["--origin-y" as string]: `${point.y}px`,
                        } as CSSProperties;

                        return (
                          <span
                            key={`${projectBursts[project.id].id}-${index}`}
                            className="completion-leaf"
                            style={style}
                          />
                        );
                      })}
                    </div>
                  ) : null}

                  {project.tasks.length === 0 ? (
                    <p className="empty-state">No tasks yet. Add one below.</p>
                  ) : (
                    <ul className="task-list">
                      {project.tasks.map((task) => {
                        const isEditingTask =
                          editingTask?.projectId === project.id && editingTask?.taskId === task.id;

                        return (
                          <li key={task.id} className={task.completed ? "task done" : "task"}>
                            {isEditingTask ? (
                              <div className="task-inline-editor">
                                <input
                                  type="text"
                                  value={taskTitleDraft}
                                  onChange={(event) => setTaskTitleDraft(event.target.value)}
                                  onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                      saveTaskTitle(project.id, task.id);
                                    }

                                    if (event.key === "Escape") {
                                      setEditingTask(null);
                                      setTaskTitleDraft("");
                                    }
                                  }}
                                  autoFocus
                                />
                              </div>
                            ) : (
                              <>
                                <label className="task-label">
                                  <input
                                    type="checkbox"
                                    checked={task.completed}
                                    onChange={(event) =>
                                      toggleTask(project.id, task.id, event.currentTarget)
                                    }
                                  />
                                  <span>{task.title}</span>
                                </label>

                                <div className="task-action-group">
                                  <button
                                    type="button"
                                    className="task-edit-button"
                                    onClick={() => {
                                      setEditingTask({ projectId: project.id, taskId: task.id });
                                      setTaskTitleDraft(task.title);
                                    }}
                                    aria-label={`Edit ${task.title}`}
                                  >
                                    ✎
                                  </button>

                                  <button
                                    type="button"
                                    className="task-delete-button"
                                    onClick={() => deleteTask(project.id, task.id)}
                                    aria-label={`Delete ${task.title}`}
                                  >
                                    ×
                                  </button>
                                </div>
                              </>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {addingTaskFor === project.id ? (
                    <div className="task-input-row">
                      <input
                        type="text"
                        value={taskDrafts[project.id] ?? ""}
                        onChange={(event) =>
                          setTaskDrafts((current) => ({
                            ...current,
                            [project.id]: event.target.value,
                          }))
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            addTaskToProject(project.id);
                          }

                          if (event.key === "Escape") {
                            setAddingTaskFor(null);
                            setTaskDrafts((current) => ({ ...current, [project.id]: "" }));
                          }
                        }}
                        placeholder="Add a task"
                        autoFocus
                      />
                    </div>
                  ) : null}

                  <button
                    type="button"
                    className="add-task-button"
                    onClick={() => {
                      setAddingTaskFor(project.id);
                      setTaskDrafts((current) => ({ ...current, [project.id]: "" }));
                    }}
                  >
                    + Add task
                  </button>
                </div>
              )}
            </article>
          );
        })}

        {addingProject ? (
          <div className="project-card project-card--composer" data-palette="lavender">
            <input
              type="text"
              className="project-name-input"
              value={newProjectName}
              onChange={(event) => setNewProjectName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  addProject();
                }

                if (event.key === "Escape") {
                  setAddingProject(false);
                  setNewProjectName("");
                }
              }}
              placeholder="Project name"
              autoFocus
            />
          </div>
        ) : null}
      </section>

      <div className="actions-row">
        <button type="button" className="new-project-button" onClick={() => setAddingProject(true)}>
          + New project
        </button>

        <span className="small-affirmation">good things take small steps.</span>

        <button type="button" className="utility-button" onClick={resetAllData}>
          Reset
        </button>
      </div>
    </main>
  );
}

export default App;