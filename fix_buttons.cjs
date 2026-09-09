const fs = require('fs');
let content = fs.readFileSync('src/components/InteriorProjectList.tsx', 'utf8');

// I accidentally deleted the </button> for RAB Draft when I deleted the <button> for Schedule earlier.
// I need to fix the JSX structure.

const target = `                            title="Buka RAB Draft Editor"
                          >
                            <FileSpreadsheet className="w-3 h-3" />
                            <span>RAB</span>
                          
                        </div>
                      </td>`;

const replacement = `                            title="Buka RAB Draft Editor"
                          >
                            <FileSpreadsheet className="w-3 h-3" />
                            <span>RAB</span>
                          </button>
                        </div>
                      </td>`;

content = content.replace(target, replacement);
fs.writeFileSync('src/components/InteriorProjectList.tsx', content);
