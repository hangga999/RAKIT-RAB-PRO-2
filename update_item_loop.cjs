const fs = require('fs');

let content = fs.readFileSync('src/components/InteriorRabDraft.tsx', 'utf8');

const regex = /\{sec\.items\.map\(\(item, itemIdx\) => \{([\s\S]*?)(?=<\/React\.Fragment>\s*\)\s*\}\)\s*<\/React\.Fragment>)/;
const replacement = `{sec.items.map((item, itemIdx) => {
                  const baseTotal = calcItemBaseTotal(item);
                  const sellUnit = calcItemSellingUnitPrice(item, sec.profitMarginPercent);
                  const sellAmount = calcItemSellingAmount(item, sec.profitMarginPercent);
                  const actualProfit = baseTotal > 0 ? ((sellAmount / baseTotal) * 100).toFixed(0) : "0";

                  const mainSpec = item.specs[0];
                  const mainSpecBaseAmt = mainSpec ? calcSpecBaseAmount(mainSpec, item.qty) : 0;
                  const remainingSpecs = item.specs.slice(1);

                  return (
                    <React.Fragment key={item.id}>
                      {/* MAIN ROW */}
                      <div className="flex bg-white divide-x divide-slate-200 hover:bg-slate-50 items-center">
                        <div className="w-12 py-2 px-2 text-center text-slate-500 font-semibold text-sm">{itemIdx + 1}</div>
                        <div className="w-64 py-2 px-2 font-semibold text-slate-800 text-sm">
                           <input type="text" value={item.description} onChange={e => updateItem(sec.id, item.id, "description", e.target.value)} className="w-full bg-transparent border-b border-transparent focus:border-slate-300 focus:outline-none p-0 placeholder-slate-300" placeholder="Work Item Description" />
                        </div>
                        
                        <div className="w-64 py-1 px-2 h-full">
                           {mainSpec ? (
                             <SpecCombobox 
                                value={mainSpec.specName} 
                                onChange={(val) => updateSpec(sec.id, item.id, mainSpec.id, "specName", val)}
                                onSelect={(name, cost) => handleSpecSelect(sec.id, item.id, mainSpec.id, name)}
                                specDatabase={specDatabase}
                             />
                           ) : (
                             <div className="text-xs text-slate-400 italic">No Spec</div>
                           )}
                        </div>

                        <div className="w-16 py-2 px-2 text-sm">
                          <input type="text" value={item.unit} onChange={e => updateItem(sec.id, item.id, "unit", e.target.value)} className="w-full text-center bg-transparent border-none focus:ring-0 p-0" />
                        </div>
                        <div className="w-20 py-2 px-2 text-sm">
                          <input type="number" value={item.qty || ""} onChange={e => updateItem(sec.id, item.id, "qty", Number(e.target.value))} className="w-full text-center bg-transparent border-none focus:ring-0 p-0 font-bold text-slate-800" />
                        </div>
                        <div className="w-32 py-2 px-2 text-right text-slate-700 text-sm">
                          {sellUnit.toLocaleString("id-ID", {maximumFractionDigits:0})}
                        </div>
                        <div className="w-32 py-2 px-2 text-right font-bold text-slate-900 text-sm">
                          {sellAmount.toLocaleString("id-ID", {maximumFractionDigits:0})}
                        </div>
                        
                        {showInternal && mainSpec && (
                          <>
                            <div className="w-24 py-1 px-1">
                               <input type="number" step="0.01" value={mainSpec.length_l || ""} onChange={e => updateSpec(sec.id, item.id, mainSpec.id, "length_l", Number(e.target.value))} className="w-full text-center text-xs border border-slate-200 rounded p-1" placeholder="L" />
                            </div>
                            <div className="w-24 py-1 px-1">
                               <input type="number" step="0.01" value={mainSpec.width_w || ""} onChange={e => updateSpec(sec.id, item.id, mainSpec.id, "width_w", Number(e.target.value))} className="w-full text-center text-xs border border-slate-200 rounded p-1" placeholder="W" />
                            </div>
                            <div className="w-24 py-1 px-1">
                               <input type="number" step="0.01" value={mainSpec.height_h || ""} onChange={e => updateSpec(sec.id, item.id, mainSpec.id, "height_h", Number(e.target.value))} className="w-full text-center text-xs border border-slate-200 rounded p-1" placeholder="H" />
                            </div>
                            <div className="w-20 py-1 px-1">
                               <input type="number" step="0.01" value={mainSpec.factor || ""} onChange={e => updateSpec(sec.id, item.id, mainSpec.id, "factor", Number(e.target.value))} className="w-full text-center text-xs border border-slate-200 rounded p-1" placeholder="Fac" />
                            </div>
                            <div className="w-32 py-1 px-1">
                               <input type="text" value={mainSpec.model} onChange={e => updateSpec(sec.id, item.id, mainSpec.id, "model", e.target.value)} className="w-full text-center text-xs border border-slate-200 rounded p-1" placeholder="Model" />
                            </div>
                            <div className="w-32 py-1 px-2 flex items-center justify-end">
                               <input type="number" value={mainSpec.baseCostUnitPrice || ""} onChange={e => updateSpec(sec.id, item.id, mainSpec.id, "baseCostUnitPrice", Number(e.target.value))} className="w-24 text-right text-xs border border-slate-200 rounded p-1 font-semibold text-slate-800" />
                            </div>
                            <div className="w-32 py-1 px-2 text-right flex items-center justify-end text-xs text-slate-500">
                               {mainSpecBaseAmt.toLocaleString("id-ID", {maximumFractionDigits:0})}
                            </div>
                            
                            <div className="w-32 py-2 px-2 text-right font-bold text-amber-600 bg-amber-50 text-sm">
                              {baseTotal.toLocaleString("id-ID", {maximumFractionDigits:0})}
                            </div>
                            <div className="w-24 py-2 px-2 text-center font-bold text-emerald-600 bg-emerald-50 text-sm">
                              {actualProfit}%
                            </div>
                          </>
                        )}
                      </div>

                      {/* SUB ROWS (Specs 2..N) */}
                      {remainingSpecs.map((spc) => {
                        const spcBaseAmt = calcSpecBaseAmount(spc, item.qty);
                        return (
                          <div key={spc.id} className="flex bg-white divide-x divide-slate-200 text-xs text-slate-600 border-b border-dashed border-slate-200 items-center">
                             <div className="w-12 bg-slate-50 h-full min-h-[36px]" />
                             <div className="w-64 bg-slate-50 h-full min-h-[36px] flex items-center justify-end px-2">
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
                             
                             <div className="w-64 py-1 px-2 h-full">
                                <SpecCombobox 
                                   value={spc.specName} 
                                   onChange={(val) => updateSpec(sec.id, item.id, spc.id, "specName", val)}
                                   onSelect={(name, cost) => handleSpecSelect(sec.id, item.id, spc.id, name)}
                                   specDatabase={specDatabase}
                                />
                             </div>
                             <div className="w-16 bg-slate-50 h-full min-h-[36px]" />
                             <div className="w-20 bg-slate-50 h-full min-h-[36px]" />
                             <div className="w-32 bg-slate-50 h-full min-h-[36px]" />
                             <div className="w-32 bg-slate-50 h-full min-h-[36px]" />
                             
                             {showInternal && (
                               <>
                                 <div className="w-24 py-1 px-1">
                                    <input type="number" step="0.01" value={spc.length_l || ""} onChange={e => updateSpec(sec.id, item.id, spc.id, "length_l", Number(e.target.value))} className="w-full text-center text-xs border border-slate-200 rounded p-1" placeholder="L" />
                                 </div>
                                 <div className="w-24 py-1 px-1">
                                    <input type="number" step="0.01" value={spc.width_w || ""} onChange={e => updateSpec(sec.id, item.id, spc.id, "width_w", Number(e.target.value))} className="w-full text-center text-xs border border-slate-200 rounded p-1" placeholder="W" />
                                 </div>
                                 <div className="w-24 py-1 px-1">
                                    <input type="number" step="0.01" value={spc.height_h || ""} onChange={e => updateSpec(sec.id, item.id, spc.id, "height_h", Number(e.target.value))} className="w-full text-center text-xs border border-slate-200 rounded p-1" placeholder="H" />
                                 </div>
                                 <div className="w-20 py-1 px-1">
                                    <input type="number" step="0.01" value={spc.factor || ""} onChange={e => updateSpec(sec.id, item.id, spc.id, "factor", Number(e.target.value))} className="w-full text-center text-xs border border-slate-200 rounded p-1" placeholder="Fac" />
                                 </div>
                                 <div className="w-32 py-1 px-1">
                                    <input type="text" value={spc.model} onChange={e => updateSpec(sec.id, item.id, spc.id, "model", e.target.value)} className="w-full text-center text-xs border border-slate-200 rounded p-1" placeholder="Model" />
                                 </div>
                                 <div className="w-32 py-1 px-2 flex items-center justify-end">
                                    <input type="number" value={spc.baseCostUnitPrice || ""} onChange={e => updateSpec(sec.id, item.id, spc.id, "baseCostUnitPrice", Number(e.target.value))} className="w-24 text-right text-xs border border-slate-200 rounded p-1 font-semibold text-slate-800" />
                                 </div>
                                 <div className="w-32 py-1 px-2 text-right flex items-center justify-end text-slate-500">
                                    {spcBaseAmt.toLocaleString("id-ID", {maximumFractionDigits:0})}
                                 </div>
                                 <div className="w-32 bg-slate-50 h-full min-h-[36px]" />
                                 <div className="w-24 bg-slate-50 h-full min-h-[36px]" />
                               </>
                             )}
                          </div>
                        )
                      })}

                      {/* ADD SPEC & REMOVE ITEM */}
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
`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/components/InteriorRabDraft.tsx', content);
