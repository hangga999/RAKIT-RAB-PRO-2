const fs = require('fs');

let code = fs.readFileSync('src/components/CreateRabProject.tsx', 'utf8');

// 1. Update toggle text
code = code.replace(
  /<span className="text-xs font-semibold text-slate-600">\n\s*Show Cost Columns\n\s*<\/span>/,
  `<span className="text-xs font-semibold text-slate-600">
              Show Cost & Real Volume
            </span>`
);
code = code.replace(
  /<span className="text-xs font-semibold text-slate-600">Show Cost Columns<\/span>/,
  `<span className="text-xs font-semibold text-slate-600">Show Cost & Real Volume</span>`
);

// 2. Update Headers
code = code.replace(
  /<th className="p-3 w-24 text-right">Vol Real<\/th>\n\s*<th className="p-3 w-24 text-right">Waste\/SF %<\/th>\n\s*<th className="p-3 w-24 text-right font-bold text-blue-700">Calc Vol<\/th>/,
  `{showCostColumns && (
                    <>
                      <th className="p-3 w-24 text-right">Vol Real</th>
                      <th className="p-3 w-24 text-right">Waste/SF %</th>
                    </>
                  )}
                  <th className="p-3 w-24 text-right font-bold text-blue-700">Vol</th>`
);

// 3. Update Body Cells
const bodyRegex = /\{\/\* Volume Real \*\/\}\n\s*<td className="p-3 text-right">[\s\S]*?\{\/\* Calculated Volume \*\/\}\n\s*<td className="p-3 text-right font-bold text-blue-700 font-mono">\n\s*\{\(row\.volume \|\| 0\)\.toLocaleString\('en-US', \{ minimumFractionDigits: 0, maximumFractionDigits: 2 \}\)\}\n\s*<\/td>/;

const newBody = `{showCostColumns && (
                        <>
                          {/* Volume Real */}
                          <td className="p-3 text-right">
                            <input
                              type="number"
                              step="any"
                              min="0"
                              value={row.volumeReal || 0}
                              onChange={e => handleVolumeRealChange(row.id, parseFloat(e.target.value) || 0)}
                              className="w-full border-b border-slate-300 bg-transparent text-right font-mono font-semibold text-slate-900 focus:outline-none focus:border-blue-500"
                            />
                          </td>
                          {/* Waste Factor */}
                          <td className="p-3 text-right">
                            <input
                              type="number"
                              step="any"
                              min="0"
                              value={row.wasteFactor || 0}
                              onChange={e => handleWasteFactorChange(row.id, parseFloat(e.target.value) || 0)}
                              className="w-full border-b border-slate-300 bg-transparent text-right font-mono font-semibold text-slate-600 focus:outline-none focus:border-amber-500"
                            />
                          </td>
                        </>
                      )}
                      {/* Calculated Volume */}
                      <td className="p-3 text-right font-bold text-blue-700 font-mono">
                        {(row.volume || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                      </td>`;

code = code.replace(bodyRegex, newBody);

fs.writeFileSync('src/components/CreateRabProject.tsx', code);
