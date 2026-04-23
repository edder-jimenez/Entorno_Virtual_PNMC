import React from 'react';

const INPUT_BASE = 'w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00DA5E] focus-visible:ring-offset-1';

export const FormField = ({
  label,
  htmlFor,
  hint,
  error,
  required = false,
  children,
  className = '',
}) => (
  <div className={`space-y-2 ${className}`.trim()}>
    {label && (
      <label htmlFor={htmlFor} className="block text-[0.72rem] font-bold uppercase tracking-[0.12em] text-slate-700">
        {label}
        {required ? <span aria-hidden="true" className="ml-1 text-rose-600">*</span> : null}
      </label>
    )}
    {children}
    {hint && <p className="text-[0.72rem] text-slate-500">{hint}</p>}
    {error && <p role="alert" className="text-[0.72rem] font-semibold text-rose-600">{error}</p>}
  </div>
);

export const TextInput = ({ id, className = '', ...props }) => (
  <input id={id} className={`${INPUT_BASE} ${className}`.trim()} {...props} />
);

export const SelectInput = ({ id, className = '', children, ...props }) => (
  <select id={id} className={`${INPUT_BASE} ${className}`.trim()} {...props}>
    {children}
  </select>
);

export const TextAreaInput = ({ id, className = '', rows = 4, ...props }) => (
  <textarea id={id} rows={rows} className={`${INPUT_BASE} ${className}`.trim()} {...props} />
);

export default FormField;
