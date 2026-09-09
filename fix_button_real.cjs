const fs = require('fs');
let content = fs.readFileSync('src/components/InteriorProjectList.tsx', 'utf8');

const target = `                            <span>RAB</span>
                        </div>
                      </td>`;

const replacement = `                            <span>RAB</span>
                          </button>
                        </div>
                      </td>`;

content = content.replace(target, replacement);
fs.writeFileSync('src/components/InteriorProjectList.tsx', content);
