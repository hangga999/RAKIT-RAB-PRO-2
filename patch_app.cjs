const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

// Import ProjectWorkspace
code = code.replace(
  /import \{ CreateRabProject \} from "\.\/components\/CreateRabProject";/,
  `import { ProjectWorkspace } from "./components/ProjectWorkspace";`
);

code = code.replace(
  /<main className="flex-1 flex flex-col overflow-hidden bg-slate-100">/,
  `<main className="flex-1 flex flex-col overflow-hidden bg-slate-100">
          {activeMenu === "project-workspace" && (
            <ProjectWorkspace
              project={editingProject}
              masterItems={masterItems}
              allProjects={projects}
              onSaveProject={handleSaveProject}
              onCloseWorkspace={() => {
                setEditingProject(null);
                setActiveMenu("project-list");
              }}
            />
          )}`
);

code = code.replace(
  /\{activeMenu === "create-rab" && \([\s\S]*?onNavigateToProjects=\{\(\) => setActiveMenu\("project-list"\)\}\n\s*\/>\n\s*\)\}/,
  ``
);

code = code.replace(
  /case "create-rab":\n\s*return "Create New RAB Project";/,
  `case "project-workspace":
        return editingProject ? "Project Workspace : " + editingProject.projectCode : "Project Workspace : New Project";`
);

code = code.replace(
  /onCreateNewClick=\{\(\) => setActiveMenu\("create-rab"\)\}/,
  `onCreateNewClick={() => {
                  setEditingProject(null);
                  setActiveMenu("project-workspace");
                }}
                onEditProject={(p) => {
                  setEditingProject(p);
                  setActiveMenu("project-workspace");
                }}`
);

fs.writeFileSync('src/App.tsx', code);
