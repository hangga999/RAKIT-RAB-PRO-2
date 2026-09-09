const fs = require('fs');

let code = fs.readFileSync('src/components/CreateRabProject.tsx', 'utf8');

// 1. Add projectCode state
code = code.replace(
  /const \[projectName, setProjectName\] = useState\(/,
  `const [projectCode, setProjectCode] = useState("PRJ-2026-001");\n  const [projectName, setProjectName] = useState(`
);

// 2. Set projectCode when editingProject changes
code = code.replace(
  /if \(editingProject\) \{\n\s*setProjectName\(editingProject\.name\);/,
  `if (editingProject) {\n      setProjectCode(editingProject.projectCode);\n      setProjectName(editingProject.name);`
);

// 3. Add to output
code = code.replace(
  /const newProject: Project = \{\n\s*id: editingProject \? editingProject\.id : Date\.now\(\)\.toString\(\),\n\s*projectCode: `PRJ-\$\{new Date\(\)\.getFullYear\(\)\}-\$\{Math\.floor\(\n\s*100 \+ Math\.random\(\) \* 900,\n\s*\)\}`,/,
  `const newProject: Project = {\n      id: editingProject ? editingProject.id : Date.now().toString(),\n      projectCode: projectCode,`
);

// Handle cases where projectCode was auto-generated above
code = code.replace(
  /projectCode: `PRJ-\$\{new Date\(\)\.getFullYear\(\)\}-\$\{Math\.floor\(100 \+ Math\.random\(\) \* 900\)\}`,/,
  `projectCode: projectCode,`
);
code = code.replace(
  /projectCode: `PRJ-\$\{new Date\(\)\.getFullYear\(\)\}-\$\{Math\.floor\([\s\S]*?100 \+ Math\.random\(\) \* 900,[\s\S]*?\)\}`,/,
  `projectCode: projectCode,`
);

// 4. Add UI field (it's currently a 4 column grid)
code = code.replace(
  /<div className="space-y-1">\n\s*<label className="text-\[10px\] font-bold text-slate-500 uppercase">\n\s*Project Name\n\s*<\/label>/,
  `<div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">
              Project Code
            </label>
            <input
              type="text"
              value={projectCode}
              onChange={(e) => setProjectCode(e.target.value)}
              className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">
              Project Name
            </label>`
);

// Change grid columns to 5 instead of 4
code = code.replace(
  /<div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 rounded-lg border border-slate-200 shadow-xs">/,
  `<div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-white p-4 rounded-lg border border-slate-200 shadow-xs">`
);


fs.writeFileSync('src/components/CreateRabProject.tsx', code);
