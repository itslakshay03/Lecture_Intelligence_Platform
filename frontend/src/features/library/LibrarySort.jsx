import React, { useId } from 'react';
import { ArrowDownUp } from 'lucide-react';
import { SORT_OPTIONS } from './lib/library';

export default function LibrarySort({ value, onChange }) {
  const selectId = useId();

  return (
    <div className="lib-sort">
      <label htmlFor={selectId} className="lib-sort-label">
        <ArrowDownUp size={13} /> Sort
      </label>
      <select
        id={selectId}
        className="lib-sort-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
