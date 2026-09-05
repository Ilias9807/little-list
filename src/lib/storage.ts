export type Task = {
  id: number;
  title: string;
  completed: boolean;
};

export type ProjectPalette = "lavender" | "sage" | "blue" | "peach" | "butter";

export type Project = {
  id: number;
  name: string;
  tasks: Task[];
  palette: ProjectPalette;
};

export const STORAGE_KEY = "little-list-projects-v1";

export const PROJECT_PALETTES: ProjectPalette[] = [
  "lavender",
  "sage",
  "blue",
  "peach",
  "butter",
];

export function getProjectPalette(index: number): ProjectPalette {
  return PROJECT_PALETTES[index % PROJECT_PALETTES.length];
}

export const initialProjects: Project[] = [
  {
    id: 1,
    name: "Work",
    palette: "lavender",
    tasks: [
      { id: 1, title: "Finish CAD review", completed: false },
      { id: 2, title: "Order bearings", completed: false },
    ],
  },
  {
    id: 2,
    name: "Personal",
    palette: "sage",
    tasks: [
      { id: 3, title: "Buy groceries", completed: false },
      { id: 4, title: "Book dentist", completed: true },
    ],
  },
];

export function loadProjects(): Project[] {
  try {
    const storedProjects = localStorage.getItem(STORAGE_KEY);

    if (!storedProjects) {
      return initialProjects;
    }

    const parsedProjects = JSON.parse(storedProjects) as Project[];

    if (!Array.isArray(parsedProjects) || parsedProjects.length === 0) {
      return initialProjects;
    }

    return parsedProjects.map((project, index) => ({
      ...project,
      palette: project.palette ?? getProjectPalette(index),
    }));
  } catch {
    return initialProjects;
  }
}

export function saveProjects(projects: Project[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}
