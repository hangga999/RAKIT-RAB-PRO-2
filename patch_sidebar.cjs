const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

code = code.replace(/create-rab/g, 'project-workspace');
code = code.replace(/Buat RAB Baru/g, 'Project Workspace');

fs.writeFileSync('src/components/Sidebar.tsx', code);
