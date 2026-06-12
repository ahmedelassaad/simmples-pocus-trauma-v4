export function NumberField({ label, value, onChange, unit, placeholder = '', step = 'any', min, max }) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="field-box">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          placeholder={placeholder}
          step={step}
          min={min}
          max={max}
          onChange={(e) => onChange(e.target.value)}
        />
        {unit && <em>{unit}</em>}
      </div>
    </label>
  );
}

export function SelectField({ label, value, onChange, options }) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="field-box select-box">
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
    </label>
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
