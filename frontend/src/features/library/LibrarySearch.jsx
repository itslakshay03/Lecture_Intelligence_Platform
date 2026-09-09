import React, { useId } from 'react';
import { Search, X } from 'lucide-react';

/** Client-side search over title / video id / task id. No backend requests. */
export default function LibrarySearch({ value, onChange, autoFocus = false }) {
  const inputId = useId();

  return (
    <div className="lib-search">
      <label htmlFor={inputId} className="lai-sr-only">
        Search your lecture library
      </label>
      <Search size={15} className="lib-search-icon" aria-hidden="true" />
      <input
        id={inputId}
        type="search"
        className="lib-search-input"
        placeholder="Search by title or video ID…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
      />
      {value && (
        <button
          type="button"
          className="lib-search-clear"
          onClick={() => onChange('')}
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
