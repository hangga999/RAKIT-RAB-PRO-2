import React, { useState, useRef, useEffect } from 'react';
import { InteriorSpecification } from '../types';
import { ChevronDown, Search } from 'lucide-react';

interface SpecComboboxProps {
  value: string;
  onChange: (val: string) => void;
  onSelect: (specName: string, baseCost: number) => void;
  specDatabase: InteriorSpecification[];
}

export const SpecCombobox: React.FC<SpecComboboxProps> = ({
  value,
  onChange,
  onSelect,
  specDatabase,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredSpecs = specDatabase.filter((spec) =>
    spec.name.toLowerCase().includes(value.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full h-full" ref={containerRef}>
      <div className="flex items-center h-full">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full bg-transparent border-b border-transparent focus:border-slate-300 focus:outline-none p-0 text-xs text-slate-800 placeholder-slate-400"
          placeholder="Type or select spec..."
        />
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 text-slate-400 hover:text-emerald-600 transition cursor-pointer"
          tabIndex={-1}
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-[300px] max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-md shadow-xl z-50">
          {filteredSpecs.length > 0 ? (
            <ul className="py-1">
              {filteredSpecs.map((spec) => (
                <li
                  key={spec.id}
                  onClick={() => {
                    onSelect(spec.name, spec.baseCost);
                    setIsOpen(false);
                  }}
                  className="px-3 py-2 text-xs hover:bg-emerald-50 cursor-pointer flex flex-col"
                >
                  <span className="font-semibold text-slate-800">{spec.name}</span>
                  <span className="text-[10px] text-slate-500 flex justify-between">
                    <span>{spec.category}</span>
                    <span className="font-bold text-emerald-600">Rp {spec.baseCost.toLocaleString('id-ID')} / {spec.unit}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-3 py-2 text-xs text-slate-500 italic">No exact matches in database</div>
          )}
        </div>
      )}
    </div>
  );
};
