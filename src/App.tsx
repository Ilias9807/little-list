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
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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
    setSearchQuery("");
    setSearchOpen(false);
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredProjects = projects.filter((project) => {
    if (!normalizedQuery) {
      return true;
    }

    const projectMatches = project.name.toLowerCase().includes(normalizedQuery);
    const taskMatches = project.tasks.some((task) =>
      task.title.toLowerCase().includes(normalizedQuery)
    );

    return projectMatches || taskMatches;
  });

  const backgroundLeaves = [
    { className: "leaf-01", style: { left: "-6%", top: "6%", width: "180px", height: "106px", ["--leaf-opacity" as string]: "0.58", ["--leaf-rotation" as string]: "-18deg", ["--leaf-vein-opacity" as string]: "0.3" } },
    { className: "leaf-02", style: { left: "6%", top: "3%", width: "92px", height: "54px", ["--leaf-opacity" as string]: "0.18", ["--leaf-rotation" as string]: "-34deg", ["--leaf-vein-opacity" as string]: "0.12" } },
    { className: "leaf-03", style: { left: "18%", top: "7%", width: "120px", height: "70px", ["--leaf-opacity" as string]: "0.23", ["--leaf-rotation" as string]: "14deg", ["--leaf-vein-opacity" as string]: "0.15" } },
    { className: "leaf-04", style: { left: "29%", top: "2%", width: "74px", height: "44px", ["--leaf-opacity" as string]: "0.1", ["--leaf-rotation" as string]: "-8deg", ["--leaf-vein-opacity" as string]: "0.07" } },
    { className: "leaf-05", style: { left: "-10%", top: "17%", width: "126px", height: "74px", ["--leaf-opacity" as string]: "0.4", ["--leaf-rotation" as string]: "24deg", ["--leaf-vein-opacity" as string]: "0.24" } },
    { className: "leaf-06", style: { left: "9%", top: "22%", width: "102px", height: "60px", ["--leaf-opacity" as string]: "0.19", ["--leaf-rotation" as string]: "-22deg", ["--leaf-vein-opacity" as string]: "0.12" } },
    { className: "leaf-07", style: { left: "22%", top: "19%", width: "150px", height: "86px", ["--leaf-opacity" as string]: "0.28", ["--leaf-rotation" as string]: "8deg", ["--leaf-vein-opacity" as string]: "0.18" } },
    { className: "leaf-08", style: { left: "34%", top: "25%", width: "86px", height: "50px", ["--leaf-opacity" as string]: "0.12", ["--leaf-rotation" as string]: "28deg", ["--leaf-vein-opacity" as string]: "0.08" } },
    { className: "leaf-09", style: { left: "-4%", top: "30%", width: "164px", height: "96px", ["--leaf-opacity" as string]: "0.49", ["--leaf-rotation" as string]: "-14deg", ["--leaf-vein-opacity" as string]: "0.26" } },
    { className: "leaf-10", style: { left: "13%", top: "31%", width: "74px", height: "44px", ["--leaf-opacity" as string]: "0.15", ["--leaf-rotation" as string]: "20deg", ["--leaf-vein-opacity" as string]: "0.09" } },
    { className: "leaf-11", style: { left: "25%", top: "36%", width: "116px", height: "68px", ["--leaf-opacity" as string]: "0.24", ["--leaf-rotation" as string]: "-30deg", ["--leaf-vein-opacity" as string]: "0.15" } },
    { className: "leaf-12", style: { left: "38%", top: "33%", width: "70px", height: "42px", ["--leaf-opacity" as string]: "0.08", ["--leaf-rotation" as string]: "16deg", ["--leaf-vein-opacity" as string]: "0.06" } },
    { className: "leaf-13", style: { left: "-11%", top: "43%", width: "116px", height: "68px", ["--leaf-opacity" as string]: "0.34", ["--leaf-rotation" as string]: "18deg", ["--leaf-vein-opacity" as string]: "0.21" } },
    { className: "leaf-14", style: { left: "8%", top: "46%", width: "142px", height: "82px", ["--leaf-opacity" as string]: "0.26", ["--leaf-rotation" as string]: "-18deg", ["--leaf-vein-opacity" as string]: "0.17" } },
    { className: "leaf-15", style: { left: "23%", top: "42%", width: "82px", height: "48px", ["--leaf-opacity" as string]: "0.14", ["--leaf-rotation" as string]: "32deg", ["--leaf-vein-opacity" as string]: "0.09" } },
    { className: "leaf-16", style: { left: "33%", top: "49%", width: "128px", height: "74px", ["--leaf-opacity" as string]: "0.21", ["--leaf-rotation" as string]: "8deg", ["--leaf-vein-opacity" as string]: "0.13" } },
    { className: "leaf-17", style: { left: "-6%", top: "55%", width: "154px", height: "90px", ["--leaf-opacity" as string]: "0.43", ["--leaf-rotation" as string]: "-24deg", ["--leaf-vein-opacity" as string]: "0.25" } },
    { className: "leaf-18", style: { left: "11%", top: "57%", width: "88px", height: "52px", ["--leaf-opacity" as string]: "0.18", ["--leaf-rotation" as string]: "18deg", ["--leaf-vein-opacity" as string]: "0.11" } },
    { className: "leaf-19", style: { left: "24%", top: "61%", width: "138px", height: "80px", ["--leaf-opacity" as string]: "0.27", ["--leaf-rotation" as string]: "-12deg", ["--leaf-vein-opacity" as string]: "0.17" } },
    { className: "leaf-20", style: { left: "37%", top: "57%", width: "72px", height: "42px", ["--leaf-opacity" as string]: "0.1", ["--leaf-rotation" as string]: "26deg", ["--leaf-vein-opacity" as string]: "0.07" } },
    { className: "leaf-21", style: { left: "2%", top: "69%", width: "104px", height: "60px", ["--leaf-opacity" as string]: "0.17", ["--leaf-rotation" as string]: "-28deg", ["--leaf-vein-opacity" as string]: "0.1" } },
    { className: "leaf-22", style: { left: "15%", top: "73%", width: "166px", height: "96px", ["--leaf-opacity" as string]: "0.38", ["--leaf-rotation" as string]: "12deg", ["--leaf-vein-opacity" as string]: "0.23" } },
    { className: "leaf-23", style: { left: "30%", top: "69%", width: "94px", height: "56px", ["--leaf-opacity" as string]: "0.16", ["--leaf-rotation" as string]: "-18deg", ["--leaf-vein-opacity" as string]: "0.1" } },
    { className: "leaf-24", style: { left: "40%", top: "76%", width: "74px", height: "44px", ["--leaf-opacity" as string]: "0.09", ["--leaf-rotation" as string]: "22deg", ["--leaf-vein-opacity" as string]: "0.06" } },
    { className: "leaf-25", style: { left: "-7%", top: "84%", width: "144px", height: "82px", ["--leaf-opacity" as string]: "0.3", ["--leaf-rotation" as string]: "24deg", ["--leaf-vein-opacity" as string]: "0.18" } },
    { className: "leaf-26", style: { left: "11%", top: "88%", width: "84px", height: "48px", ["--leaf-opacity" as string]: "0.15", ["--leaf-rotation" as string]: "-12deg", ["--leaf-vein-opacity" as string]: "0.09" } },
    { className: "leaf-27", style: { left: "26%", top: "83%", width: "118px", height: "70px", ["--leaf-opacity" as string]: "0.22", ["--leaf-rotation" as string]: "30deg", ["--leaf-vein-opacity" as string]: "0.14" } },
    { className: "leaf-28", style: { left: "39%", top: "91%", width: "90px", height: "52px", ["--leaf-opacity" as string]: "0.08", ["--leaf-rotation" as string]: "-20deg", ["--leaf-vein-opacity" as string]: "0.05" } },
    { className: "leaf-29", style: { right: "-6%", top: "6%", width: "180px", height: "106px", ["--leaf-opacity" as string]: "0.55", ["--leaf-rotation" as string]: "18deg", ["--leaf-vein-opacity" as string]: "0.28" } },
    { className: "leaf-30", style: { right: "6%", top: "3%", width: "92px", height: "54px", ["--leaf-opacity" as string]: "0.17", ["--leaf-rotation" as string]: "32deg", ["--leaf-vein-opacity" as string]: "0.12" } },
    { className: "leaf-31", style: { right: "18%", top: "8%", width: "120px", height: "70px", ["--leaf-opacity" as string]: "0.22", ["--leaf-rotation" as string]: "-16deg", ["--leaf-vein-opacity" as string]: "0.14" } },
    { className: "leaf-32", style: { right: "29%", top: "2%", width: "74px", height: "44px", ["--leaf-opacity" as string]: "0.1", ["--leaf-rotation" as string]: "10deg", ["--leaf-vein-opacity" as string]: "0.07" } },
    { className: "leaf-33", style: { right: "-10%", top: "17%", width: "126px", height: "74px", ["--leaf-opacity" as string]: "0.39", ["--leaf-rotation" as string]: "-24deg", ["--leaf-vein-opacity" as string]: "0.24" } },
    { className: "leaf-34", style: { right: "9%", top: "22%", width: "102px", height: "60px", ["--leaf-opacity" as string]: "0.18", ["--leaf-rotation" as string]: "20deg", ["--leaf-vein-opacity" as string]: "0.12" } },
    { className: "leaf-35", style: { right: "22%", top: "19%", width: "150px", height: "86px", ["--leaf-opacity" as string]: "0.27", ["--leaf-rotation" as string]: "-8deg", ["--leaf-vein-opacity" as string]: "0.18" } },
    { className: "leaf-36", style: { right: "34%", top: "25%", width: "86px", height: "50px", ["--leaf-opacity" as string]: "0.11", ["--leaf-rotation" as string]: "-28deg", ["--leaf-vein-opacity" as string]: "0.08" } },
    { className: "leaf-37", style: { right: "-4%", top: "30%", width: "164px", height: "96px", ["--leaf-opacity" as string]: "0.47", ["--leaf-rotation" as string]: "14deg", ["--leaf-vein-opacity" as string]: "0.26" } },
    { className: "leaf-38", style: { right: "13%", top: "31%", width: "74px", height: "44px", ["--leaf-opacity" as string]: "0.15", ["--leaf-rotation" as string]: "-18deg", ["--leaf-vein-opacity" as string]: "0.09" } },
    { className: "leaf-39", style: { right: "25%", top: "36%", width: "116px", height: "68px", ["--leaf-opacity" as string]: "0.24", ["--leaf-rotation" as string]: "28deg", ["--leaf-vein-opacity" as string]: "0.15" } },
    { className: "leaf-40", style: { right: "38%", top: "33%", width: "70px", height: "42px", ["--leaf-opacity" as string]: "0.08", ["--leaf-rotation" as string]: "-16deg", ["--leaf-vein-opacity" as string]: "0.06" } },
    { className: "leaf-41", style: { right: "-11%", top: "43%", width: "116px", height: "68px", ["--leaf-opacity" as string]: "0.33", ["--leaf-rotation" as string]: "-18deg", ["--leaf-vein-opacity" as string]: "0.2" } },
    { className: "leaf-42", style: { right: "8%", top: "46%", width: "142px", height: "82px", ["--leaf-opacity" as string]: "0.25", ["--leaf-rotation" as string]: "18deg", ["--leaf-vein-opacity" as string]: "0.16" } },
    { className: "leaf-43", style: { right: "23%", top: "42%", width: "82px", height: "48px", ["--leaf-opacity" as string]: "0.13", ["--leaf-rotation" as string]: "-32deg", ["--leaf-vein-opacity" as string]: "0.09" } },
    { className: "leaf-44", style: { right: "33%", top: "49%", width: "128px", height: "74px", ["--leaf-opacity" as string]: "0.2", ["--leaf-rotation" as string]: "-10deg", ["--leaf-vein-opacity" as string]: "0.13" } },
    { className: "leaf-45", style: { right: "-6%", top: "55%", width: "154px", height: "90px", ["--leaf-opacity" as string]: "0.41", ["--leaf-rotation" as string]: "24deg", ["--leaf-vein-opacity" as string]: "0.24" } },
    { className: "leaf-46", style: { right: "11%", top: "57%", width: "88px", height: "52px", ["--leaf-opacity" as string]: "0.17", ["--leaf-rotation" as string]: "-18deg", ["--leaf-vein-opacity" as string]: "0.1" } },
    { className: "leaf-47", style: { right: "24%", top: "61%", width: "138px", height: "80px", ["--leaf-opacity" as string]: "0.26", ["--leaf-rotation" as string]: "12deg", ["--leaf-vein-opacity" as string]: "0.17" } },
    { className: "leaf-48", style: { right: "37%", top: "57%", width: "72px", height: "42px", ["--leaf-opacity" as string]: "0.1", ["--leaf-rotation" as string]: "-26deg", ["--leaf-vein-opacity" as string]: "0.07" } },
    { className: "leaf-49", style: { right: "2%", top: "69%", width: "104px", height: "60px", ["--leaf-opacity" as string]: "0.17", ["--leaf-rotation" as string]: "28deg", ["--leaf-vein-opacity" as string]: "0.1" } },
    { className: "leaf-50", style: { right: "15%", top: "73%", width: "166px", height: "96px", ["--leaf-opacity" as string]: "0.36", ["--leaf-rotation" as string]: "-12deg", ["--leaf-vein-opacity" as string]: "0.22" } },
    { className: "leaf-51", style: { right: "30%", top: "69%", width: "94px", height: "56px", ["--leaf-opacity" as string]: "0.15", ["--leaf-rotation" as string]: "18deg", ["--leaf-vein-opacity" as string]: "0.1" } },
    { className: "leaf-52", style: { right: "40%", top: "76%", width: "74px", height: "44px", ["--leaf-opacity" as string]: "0.09", ["--leaf-rotation" as string]: "-22deg", ["--leaf-vein-opacity" as string]: "0.06" } },
    { className: "leaf-53", style: { right: "-7%", top: "84%", width: "144px", height: "82px", ["--leaf-opacity" as string]: "0.29", ["--leaf-rotation" as string]: "-24deg", ["--leaf-vein-opacity" as string]: "0.18" } },
    { className: "leaf-54", style: { right: "11%", top: "88%", width: "84px", height: "48px", ["--leaf-opacity" as string]: "0.14", ["--leaf-rotation" as string]: "12deg", ["--leaf-vein-opacity" as string]: "0.09" } },
    { className: "leaf-55", style: { right: "26%", top: "83%", width: "118px", height: "70px", ["--leaf-opacity" as string]: "0.21", ["--leaf-rotation" as string]: "-30deg", ["--leaf-vein-opacity" as string]: "0.14" } },
    { className: "leaf-56", style: { right: "39%", top: "91%", width: "90px", height: "52px", ["--leaf-opacity" as string]: "0.08", ["--leaf-rotation" as string]: "20deg", ["--leaf-vein-opacity" as string]: "0.05" } },
    { className: "leaf-57", style: { left: "42%", top: "16%", width: "70px", height: "42px", ["--leaf-opacity" as string]: "0.065", ["--leaf-rotation" as string]: "8deg", ["--leaf-vein-opacity" as string]: "0.045" } },
    { className: "leaf-58", style: { left: "38%", top: "28%", width: "62px", height: "38px", ["--leaf-opacity" as string]: "0.055", ["--leaf-rotation" as string]: "-20deg", ["--leaf-vein-opacity" as string]: "0.035" } },
    { className: "leaf-59", style: { left: "42%", top: "41%", width: "78px", height: "46px", ["--leaf-opacity" as string]: "0.065", ["--leaf-rotation" as string]: "18deg", ["--leaf-vein-opacity" as string]: "0.045" } },
    { className: "leaf-60", style: { left: "41%", top: "58%", width: "66px", height: "40px", ["--leaf-opacity" as string]: "0.06", ["--leaf-rotation" as string]: "-12deg", ["--leaf-vein-opacity" as string]: "0.04" } },
    { className: "leaf-61", style: { left: "44%", top: "69%", width: "74px", height: "44px", ["--leaf-opacity" as string]: "0.055", ["--leaf-rotation" as string]: "28deg", ["--leaf-vein-opacity" as string]: "0.035" } },
    { className: "leaf-62", style: { right: "42%", top: "16%", width: "70px", height: "42px", ["--leaf-opacity" as string]: "0.065", ["--leaf-rotation" as string]: "-8deg", ["--leaf-vein-opacity" as string]: "0.045" } },
    { className: "leaf-63", style: { right: "38%", top: "28%", width: "62px", height: "38px", ["--leaf-opacity" as string]: "0.055", ["--leaf-rotation" as string]: "20deg", ["--leaf-vein-opacity" as string]: "0.035" } },
    { className: "leaf-64", style: { right: "42%", top: "41%", width: "78px", height: "46px", ["--leaf-opacity" as string]: "0.065", ["--leaf-rotation" as string]: "-18deg", ["--leaf-vein-opacity" as string]: "0.045" } },
    { className: "leaf-65", style: { right: "41%", top: "58%", width: "66px", height: "40px", ["--leaf-opacity" as string]: "0.06", ["--leaf-rotation" as string]: "12deg", ["--leaf-vein-opacity" as string]: "0.04" } },
    { className: "leaf-66", style: { right: "44%", top: "69%", width: "74px", height: "44px", ["--leaf-opacity" as string]: "0.055", ["--leaf-rotation" as string]: "-28deg", ["--leaf-vein-opacity" as string]: "0.035" } },
  ] as const;

  return (
    <main className="app-shell">
      {backgroundLeaves.map((leaf) => (
        <span
          key={leaf.className}
          className={`background-leaf ${leaf.className}`}
          style={leaf.style as CSSProperties}
          aria-hidden="true"
        >
          <svg
            className="leaf-art"
            viewBox="0 0 100 62"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <clipPath
                id={`leaf-silhouette-${leaf.className}`}
                clipPathUnits="userSpaceOnUse"
              >
                <path d="M8 42 C18 15, 49 4, 88 12 C79 34, 58 54, 8 42 Z" />
              </clipPath>
            </defs>

            {/* Leaf body */}
            <path
              className="leaf-body"
              d="M8 42 C18 15, 49 4, 88 12 C79 34, 58 54, 8 42 Z"
            />

            {/* All internal lines share the same coordinate system and are
                clipped to the leaf silhouette. */}
            <g
              className="leaf-structure"
              clipPath={`url(#leaf-silhouette-${leaf.className})`}
            >
              {/* Central midrib */}
              <path
                className="leaf-midrib"
                d="M12 39 C27 32, 43 25, 59 18 C71 14, 80 12, 86 12"
              />

              {/*
               * Each secondary vein begins on the actual midrib.
               * The attachment points follow the midrib curve:
               * left side: 19.5,35.9 / 28.9,31.1 / 38.9,26.3
               * / 49.3,21.8 / 60.0,17.6
               * right side uses the same midrib attachment points.
               */}

              <path className="leaf-vein" d="M19.5 35.9 C16 29 12 24 8 21" />
              <path className="leaf-vein" d="M28.9 31.1 C25 24 21 19 16 15" />
              <path className="leaf-vein" d="M38.9 26.7 C35 20 31 15 26 11" />
              <path className="leaf-vein" d="M49.3 22.0 C46 16 42 12 38 8" />
              <path className="leaf-vein" d="M60.0 17.7 C58 13 55 9 52 6" />

              <path className="leaf-vein" d="M28.9 31.1 C35 34 40 37 45 41" />
              <path className="leaf-vein" d="M38.9 26.7 C45 30 51 33 57 37" />
              <path className="leaf-vein" d="M49.3 22.0 C56 25 62 28 69 31" />
              <path className="leaf-vein" d="M60.0 17.7 C67 20 74 23 81 26" />
              <path className="leaf-vein" d="M70.2 14.3 C77 16 83 18 89 21" />
            </g>
          </svg>
        </span>
      ))}

      <header className="app-header">
        <div className="brand-row">
          <div className="brand-block">
            <span className="brand-name">little lists</span>
            <span className="brand-tagline">your little place</span>
          </div>

          <div className="header-actions" aria-label="Header actions">
            <button
              type="button"
              className={searchOpen ? "icon-button is-active" : "icon-button"}
              aria-label="Search tasks"
              onClick={() => setSearchOpen((current) => !current)}
            >
              ⌕
            </button>
          </div>
        </div>

        {searchOpen ? (
          <div className="header-search-wrap">
            <input
              type="text"
              className="header-search-input"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search tasks and projects"
              autoFocus
            />
          </div>
        ) : null}
      </header>

      <section className="project-list" aria-label="Projects">
        {filteredProjects.length === 0 ? (
          <p className="empty-state">No matching projects or tasks.</p>
        ) : null}

        {filteredProjects.map((project, index) => {
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

                  {(() => {
                    const visibleTasks = normalizedQuery
                      ? project.tasks.filter((task) =>
                          task.title.toLowerCase().includes(normalizedQuery)
                        )
                      : project.tasks;

                    if (visibleTasks.length === 0) {
                      return (
                        <p className="empty-state">
                          {normalizedQuery ? "No matching tasks." : "No tasks yet. Add one below."}
                        </p>
                      );
                    }

                    return (
                      <ul className="task-list">
                        {visibleTasks.map((task) => {
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
                    );
                  })()}

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

      <p className="site-philosophy">
        No ads. No accounts. No clutter. Just your lists.
      </p>
    </main>
  );
}

export default App;