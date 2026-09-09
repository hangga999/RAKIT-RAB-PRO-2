const fs = require('fs');

let code = fs.readFileSync('src/components/MasterProjectList.tsx', 'utf8');

// 1. We need to add an onEditProject to props
code = code.replace(
  /onSelectProjectForSchedule: \(p: Project\) => void;\n\s*onCreateNewClick: \(\) => void;/,
  `onSelectProjectForSchedule: (p: Project) => void;\n  onCreateNewClick: () => void;\n  onEditProject: (p: Project) => void;`
);
code = code.replace(
  /onSelectProjectForSchedule,\n\s*onCreateNewClick,\n\}\) => \{/,
  `onSelectProjectForSchedule,\n  onCreateNewClick,\n  onEditProject,\n}) => {`
);

// 2. Add Project Code header
code = code.replace(
  /<th className="p-4 w-10 text-center">No<\/th>\n\s*<th className="p-4">Project Name & Description<\/th>/,
  `<th className="p-4 w-10 text-center">No</th>\n                  <th className="p-4 w-32">Project Code</th>\n                  <th className="p-4">Project Name & Description</th>`
);

// 3. Add Project Code cell and Edit RAB button
code = code.replace(
  /<td className="p-4 text-center">\{idx \+ 1\}<\/td>\n\s*<td className="p-4">/,
  `<td className="p-4 text-center">{idx + 1}</td>
                        <td className="p-4">
                          <span className="font-mono text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded">
                            {p.projectCode}
                          </span>
                        </td>
                        <td className="p-4">`
);

code = code.replace(
  /onClick=\{\(\) => onSelectProjectForSchedule\(p\)\}\n\s*className="flex items-center gap-1 bg-white border border-slate-300 text-slate-700 px-3 py-1\.5 rounded text-xs font-semibold hover:bg-slate-50 transition-colors"/,
  `onClick={() => onSelectProjectForSchedule(p)}
                              className="flex items-center gap-1 bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded text-xs font-semibold hover:bg-slate-50 transition-colors"
                            >
                              <TrendingUp className="w-3.5 h-3.5" />
                              View Schedule
                            </button>
                            <button
                              onClick={() => onEditProject(p)}
                              className="flex items-center gap-1 bg-blue-600 border border-blue-600 text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-blue-700 transition-colors"`
);

// Ensure TrendingUp is replaced cleanly if we duplicated it
code = code.replace(/<TrendingUp className="w-3\.5 h-3\.5" \/>\n\s*View Schedule\n\s*<\/button>\n\s*>\n\s*<TrendingUp className="w-3\.5 h-3\.5" \/>\n\s*Schedule & S-Curve\n\s*<\/button>/g, 
  `<TrendingUp className="w-3.5 h-3.5" />
                              Schedule & S-Curve
                            </button>`); // oops wait I need to do a cleaner replace.

fs.writeFileSync('src/components/MasterProjectList.tsx', code);
