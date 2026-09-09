const fs = require('fs');
let content = fs.readFileSync('src/components/InteriorRabDraft.tsx', 'utf8');

// I also need to update the showInternal for the MAIN row, because it currently maps to item.specs[0] but using a static <div className="w-[500px]"> which isn't correct.

const target = `{showInternal && (
                          <>
                            <div className="w-[500px] bg-slate-50" />
                            <div className="w-32 py-2 px-2 text-right font-bold text-amber-600 bg-amber-50">
                              {baseTotal.toLocaleString("id-ID", {maximumFractionDigits:0})}
                            </div>
                            <div className="w-24 py-2 px-2 text-center font-bold text-emerald-600 bg-emerald-50">
                              {actualProfit}%
                            </div>
                          </>
                        )}`;

const replacement = `{showInternal && item.specs[0] && (
                          <>
                            <div className="w-24 py-1 px-1">
                               <input type="number" step="0.01" value={item.specs[0].length_l || ""} onChange={e => updateSpec(sec.id, item.id, item.specs[0].id, "length_l", Number(e.target.value))} className="w-full text-center text-xs border border-slate-200 rounded p-1" placeholder="L" />
                            </div>
                            <div className="w-24 py-1 px-1">
                               <input type="number" step="0.01" value={item.specs[0].width_w || ""} onChange={e => updateSpec(sec.id, item.id, item.specs[0].id, "width_w", Number(e.target.value))} className="w-full text-center text-xs border border-slate-200 rounded p-1" placeholder="W" />
                            </div>
                            <div className="w-24 py-1 px-1">
                               <input type="number" step="0.01" value={item.specs[0].height_h || ""} onChange={e => updateSpec(sec.id, item.id, item.specs[0].id, "height_h", Number(e.target.value))} className="w-full text-center text-xs border border-slate-200 rounded p-1" placeholder="H" />
                            </div>
                            <div className="w-20 py-1 px-1">
                               <input type="number" step="0.01" value={item.specs[0].factor || ""} onChange={e => updateSpec(sec.id, item.id, item.specs[0].id, "factor", Number(e.target.value))} className="w-full text-center text-xs border border-slate-200 rounded p-1" placeholder="Fac" />
                            </div>
                            <div className="w-32 py-1 px-1">
                               <input type="text" value={item.specs[0].model} onChange={e => updateSpec(sec.id, item.id, item.specs[0].id, "model", e.target.value)} className="w-full text-center text-xs border border-slate-200 rounded p-1" placeholder="Model" />
                            </div>
                            <div className="w-32 py-1 px-2 flex items-center justify-end">
                               <input type="number" value={item.specs[0].baseCostUnitPrice || ""} onChange={e => updateSpec(sec.id, item.id, item.specs[0].id, "baseCostUnitPrice", Number(e.target.value))} className="w-24 text-right text-xs border border-slate-200 rounded p-1 font-semibold text-slate-800" />
                            </div>
                            <div className="w-32 py-1 px-2 text-right flex items-center justify-end text-xs text-slate-500">
                               {calcSpecBaseAmount(item.specs[0], item.qty).toLocaleString("id-ID", {maximumFractionDigits:0})}
                            </div>
                            
                            <div className="w-32 py-2 px-2 text-right font-bold text-amber-600 bg-amber-50 text-sm">
                              {baseTotal.toLocaleString("id-ID", {maximumFractionDigits:0})}
                            </div>
                            <div className="w-24 py-2 px-2 text-center font-bold text-emerald-600 bg-emerald-50 text-sm">
                              {actualProfit}%
                            </div>
                          </>
                        )}
                        {showInternal && !item.specs[0] && (
                          <>
                            <div className="w-24 bg-slate-50" />
                            <div className="w-24 bg-slate-50" />
                            <div className="w-24 bg-slate-50" />
                            <div className="w-20 bg-slate-50" />
                            <div className="w-32 bg-slate-50" />
                            <div className="w-32 bg-slate-50" />
                            <div className="w-32 bg-slate-50" />
                            <div className="w-32 py-2 px-2 text-right font-bold text-amber-600 bg-amber-50">
                              {baseTotal.toLocaleString("id-ID", {maximumFractionDigits:0})}
                            </div>
                            <div className="w-24 py-2 px-2 text-center font-bold text-emerald-600 bg-emerald-50">
                              {actualProfit}%
                            </div>
                          </>
                        )}`;

content = content.replace(target, replacement);
fs.writeFileSync('src/components/InteriorRabDraft.tsx', content);
