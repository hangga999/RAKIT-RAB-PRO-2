const fs = require('fs');

let code = fs.readFileSync('src/components/CreateRabProject.tsx', 'utf8');

code = code.replace(
  /const handleVolumeChange = \(rowId: string, newVolume: number\) => \{[\s\S]*?\}\);[\s\S]*?\};/,
  `const handleVolumeRealChange = (rowId: string, newVol: number) => {
    const validVol = isNaN(newVol) || newVol < 0 ? 0 : newVol;
    setRabRows((prevRows) =>
      prevRows.map((row) => {
        if (row.id === rowId) {
          const calcVol = validVol * (1 + (row.wasteFactor || 0) / 100);
          return {
            ...row,
            volumeReal: validVol,
            volume: calcVol,
            totalPrice: calcVol * row.unitPrice,
          };
        }
        return row;
      }),
    );
  };

  const handleWasteFactorChange = (rowId: string, newWaste: number) => {
    const validWaste = isNaN(newWaste) || newWaste < 0 ? 0 : newWaste;
    setRabRows((prevRows) =>
      prevRows.map((row) => {
        if (row.id === rowId) {
          const calcVol = (row.volumeReal || 0) * (1 + validWaste / 100);
          return {
            ...row,
            wasteFactor: validWaste,
            volume: calcVol,
            totalPrice: calcVol * row.unitPrice,
          };
        }
        return row;
      }),
    );
  };`
);

fs.writeFileSync('src/components/CreateRabProject.tsx', code);
