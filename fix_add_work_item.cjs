const fs = require('fs');
let content = fs.readFileSync('src/components/InteriorRabDraft.tsx', 'utf8');

// The issue: The "+ ADD WORK ITEM" button is currently inside the `sec.items.map` loop.
// It needs to be OUTSIDE the `sec.items.map` loop, directly under the section so that even empty sections can have items added!

const regex = /\{\/\* ADD SPEC & REMOVE ITEM \*\/\}([\s\S]*?)<\/div>\s*<\/React\.Fragment>\s*\);\s*\}\)\}\s*<div className="bg-white border-b-2 border-slate-300 pt-1 pb-3 pl-14">\s*<button onClick=\{\(\) => addItem\(sec\.id\)\} className="text-\[10px\] font-bold text-slate-400 bg-slate-100 hover:bg-slate-200 hover:text-slate-700 px-3 py-1 rounded transition cursor-pointer">\+ ADD WORK ITEM<\/button>\s*<\/div>/;

const replacement = `{/* ADD SPEC & REMOVE ITEM */}
                      <div className="bg-white border-b-2 border-slate-300 pt-1 pb-3 pl-14 flex items-center gap-4">
                        <button onClick={() => addSpecRow(sec.id, item.id)} className="text-[10px] font-bold text-slate-400 bg-slate-100 hover:bg-slate-200 hover:text-emerald-600 px-3 py-1 rounded transition cursor-pointer flex items-center gap-1">
                          <Plus className="w-3 h-3" /> ADD SPEC ROW
                        </button>
                        
                        <div className="w-px h-4 bg-slate-200" />
                        
                        <button 
                          onClick={() => {
                             const newItems = sec.items.filter(i => i.id !== item.id);
                             updateSection(sec.id, "items", newItems);
                          }} 
                          className="text-[10px] font-bold text-red-400 hover:text-red-600 transition cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> DELETE WORK ITEM
                        </button>
                      </div>
                    </React.Fragment>
                  );
                })}

                <div className="bg-white border-b-2 border-slate-300 pt-2 pb-4 pl-14">
                  <button onClick={() => addItem(sec.id)} className="text-[10px] font-bold text-slate-400 bg-slate-100 hover:bg-slate-200 hover:text-slate-800 px-4 py-2 rounded transition cursor-pointer flex items-center gap-1 border border-slate-200 shadow-xs">
                    <Plus className="w-3 h-3" /> ADD NEW WORK ITEM
                  </button>
                </div>`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/components/InteriorRabDraft.tsx', content);
