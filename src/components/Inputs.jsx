import { forwardRef } from 'react';

export const NumberField = forwardRef(function NumberField({
  label,
  value,
  onChange,
  unit,
  placeholder = '',
  step = 'any',
  min,
  max,
  onEnter,
  enterKeyHint = 'next',
  autoComplete = 'off'
}, ref) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="field-box">
        <input
          ref={ref}
          type="text"
          inputMode="decimal"
          pattern="[0-9.,-]*"
          enterKeyHint={enterKeyHint}
          autoComplete={autoComplete}
          value={value}
          placeholder={placeholder}
          step={step}
          min={min}
          max={max}
          onChange={(e) => {
            const raw = e.target.value;
            const accepted = raw.replace(/[^0-9.,-]/g, '');
            onChange(accepted);
          }}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return;
            e.preventDefault();
            if (onEnter) {
              onEnter();
              return;
            }
            const fields = Array.from(document.querySelectorAll('input:not([type="hidden"]), select, textarea, button'))
              .filter((element) => !element.disabled && element.tabIndex !== -1 && element.offsetParent !== null);
            const index = fields.indexOf(e.currentTarget);
            const next = fields[index + 1];
            if (next?.focus) next.focus();
          }}
        />
        {unit && <em>{unit}</em>}
      </div>
    </label>
  );
});

export function SelectField({ label, value, onChange, options }) {
  const selected = options.find((option) => option.value === value);

  if (!options || options.length <= 1) {
    return (
      <div className="field option-field">
        <span>{label}</span>
        <div className="select-static-note">{selected?.label || options?.[0]?.label || 'Sem opções adicionais'}</div>
      </div>
    );
  }

  return (
    <div className="field option-field">
      <span>{label}</span>
      <div className="option-grid" role="radiogroup" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={value === option.value ? 'option-pill option-pill-active' : 'option-pill'}
            onClick={() => onChange(option.value)}
            aria-pressed={value === option.value}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Segmented({ value, onChange, options }) {
  return (
    <div className="segmented" role="tablist">
      {options.map((option) => (
        <button
          key={option.value}
          className={value === option.value ? 'active' : ''}
          onClick={() => onChange(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function ToggleRow({ label, checked, onChange, helper }) {
  return (
    <label className="toggle-row">
      <span>
        {label}
        {helper && <small>{helper}</small>}
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}
