const fs = require('fs');
let content = fs.readFileSync('src/components/InteriorRabDraft.tsx', 'utf8');

const target = `{item.specs.map((spc) => {
                        const spcBaseAmt = calcSpecBaseAmount(spc, item.qty);
                        return (
                          <div key={spc.id} className="flex bg-white divide-x divide-slate-200 text-xs text-slate-600 border-b border-dashed border-slate-200">
                             <div className="w-12 bg-slate-50" />
                             <div className="w-64 bg-slate-50" />
                             <div className="w-64 py-1 px-2">
                                <input list="spec-db" type="text" value={spc.specName} onChange={e => handleSpecSelect(sec.id, item.id, spc.id, e.target.value)} className="w-full text-xs bg-transparent border-none p-0 focus:ring-0" placeholder="Material specification..." />
                             </div>`;

const replacement = `{item.specs.slice(1).map((spc) => {
                        const spcBaseAmt = calcSpecBaseAmount(spc, item.qty);
                        return (
                          <div key={spc.id} className="flex bg-white divide-x divide-slate-200 text-xs text-slate-600 border-b border-dashed border-slate-200 items-center">
                             <div className="w-12 bg-slate-50 h-full min-h-[36px]" />
                             <div className="w-64 bg-slate-50 h-full min-h-[36px] flex justify-end items-center px-2">
                                <button 
                                  onClick={() => {
                                    const newSpecs = item.specs.filter(s => s.id !== spc.id);
                                    updateItem(sec.id, item.id, "specs", newSpecs);
                                  }} 
                                  className="text-red-400 hover:text-red-600 p-1 cursor-pointer"
                                  title="Remove Sub-Row"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                             </div>
                             <div className="w-64 py-1 px-2">
                                <SpecCombobox 
                                   value={spc.specName} 
                                   onChange={(val) => updateSpec(sec.id, item.id, spc.id, "specName", val)}
                                   onSelect={(name, cost) => handleSpecSelect(sec.id, item.id, spc.id, name)}
                                   specDatabase={specDatabase}
                                />
                             </div>`;

content = content.replace(target, replacement);
fs.writeFileSync('src/components/InteriorRabDraft.tsx', content);
