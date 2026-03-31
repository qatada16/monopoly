import { useState, useRef, useEffect } from 'react';

export default function CustomDropdown({ value, onChange, options, placeholder = 'Select...' }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') setOpen(false); };
    if (open) {
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }
  }, [open]);

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <div className={`custom-dropdown ${open ? 'custom-dropdown-open' : ''}`} ref={containerRef}>
      <button
        type="button"
        className="custom-dropdown-trigger"
        onClick={() => setOpen(!open)}
      >
        <span className={`custom-dropdown-label ${!selected ? 'custom-dropdown-placeholder' : ''}`}>
          {selected ? selected.label : placeholder}
        </span>
        <svg className="custom-dropdown-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="custom-dropdown-menu">
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              className={`custom-dropdown-option ${opt.value === value ? 'custom-dropdown-option-selected' : ''}`}
              onClick={() => handleSelect(opt.value)}
            >
              {opt.label}
            </button>
          ))}
          {options.length === 0 && (
            <div className="custom-dropdown-empty">No options</div>
          )}
        </div>
      )}
    </div>
  );
}
