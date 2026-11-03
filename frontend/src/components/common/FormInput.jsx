import React from 'react';

export const FormInput = ({
  label,
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  required = false,
  error = '',
  helperText = '',
  icon: Icon = null,
  options = [],
  rows = 3,
  disabled = false,
  className = ''
}) => {
  const inputId = id || name;

  const baseInputStyles = `w-full rounded-xl border text-sm transition-all duration-150 focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-400 ${
    error
      ? 'border-rose-300 text-rose-900 focus:border-rose-500 focus:ring-rose-200 bg-rose-50/20'
      : 'border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-blue-100 bg-white'
  }`;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="text-xs font-bold text-slate-700 tracking-wide uppercase">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}

        {type === 'select' ? (
          <select
            id={inputId}
            name={name}
            value={value}
            onChange={onChange}
            disabled={disabled}
            required={required}
            className={`${baseInputStyles} ${Icon ? 'pl-10' : 'px-3.5'} py-2.5 bg-white appearance-none cursor-pointer`}
          >
            {options.map((opt, idx) => {
              const val = typeof opt === 'object' ? opt.value : opt;
              const label = typeof opt === 'object' ? opt.label : opt;
              return (
                <option key={idx} value={val}>
                  {label}
                </option>
              );
            })}
          </select>
        ) : type === 'textarea' ? (
          <textarea
            id={inputId}
            name={name}
            rows={rows}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className={`${baseInputStyles} ${Icon ? 'pl-10' : 'px-3.5'} py-2.5 resize-none`}
          />
        ) : (
          <input
            id={inputId}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className={`${baseInputStyles} ${Icon ? 'pl-10' : 'px-3.5'} py-2.5`}
          />
        )}
      </div>

      {error && <p className="text-xs font-medium text-rose-500 mt-0.5">{error}</p>}
      {!error && helperText && <p className="text-xs text-slate-400 mt-0.5">{helperText}</p>}
    </div>
  );
};

export default FormInput;
