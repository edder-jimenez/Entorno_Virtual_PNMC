import React from 'react';

const BADGE_VARIANTS = {
  neutral: 'bg-slate-100 text-slate-700 border border-slate-200',
  success: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  warning: 'bg-amber-100 text-amber-800 border border-amber-200',
  info: 'bg-sky-100 text-sky-800 border border-sky-200',
  accent: 'bg-[#291242]/10 text-[#291242] border border-[#291242]/20',
};

export const Badge = ({ children, variant = 'neutral', className = '' }) => (
  <span className={`inline-flex items-center rounded-full px-3 py-1 text-[0.64rem] font-bold uppercase tracking-[0.12em] ${BADGE_VARIANTS[variant] || BADGE_VARIANTS.neutral} ${className}`.trim()}>
    {children}
  </span>
);

export default Badge;
