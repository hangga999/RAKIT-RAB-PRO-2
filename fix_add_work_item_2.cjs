const fs = require('fs');
let content = fs.readFileSync('src/components/InteriorRabDraft.tsx', 'utf8');

// Wait, the regex failed because it was looking for {/* ADD SPEC & REMOVE ITEM */} but that got lost or didn't exist in the actual file.

// Ah! I see the problem. The file currently has:
//                      })}
//                      <div className="bg-white border-b-2 border-slate-300 pt-1 pb-3 pl-14">
//                        <button onClick={() => addItem(sec.id)} className="text-[10px] font-bold text-slate-400 bg-slate-100 hover:bg-slate-200 hover:text-slate-700 px-3 py-1 rounded transition cursor-pointer">+ ADD WORK ITEM</button>
//                      </div>
//                    </React.Fragment>
//                  );
//                })}

const target = `                      })}
                      <div className="bg-white border-b-2 border-slate-300 pt-1 pb-3 pl-14">
                        <button onClick={() => addItem(sec.id)} className="text-[10px] font-bold text-slate-400 bg-slate-100 hover:bg-slate-200 hover:text-slate-700 px-3 py-1 rounded transition cursor-pointer">+ ADD WORK ITEM</button>
                      </div>
                    </React.Fragment>
                  );
                })}`;

const replacement = `                      })}
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

content = content.replace(target, replacement);
fs.writeFileSync('src/components/InteriorRabDraft.tsx', content);
