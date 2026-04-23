import React from 'react';

export const Card = ({
  children,
  className = '',
  padding = 'md',
  elevated = false,
  bordered = true,
}) => {
  const paddings = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <article
      className={[
        'rounded-[1.6rem] bg-white',
        bordered ? 'border border-slate-200/70' : '',
        elevated ? 'shadow-[0_18px_50px_rgba(15,23,42,0.08)]' : 'shadow-sm',
        paddings[padding] || paddings.md,
        className,
      ].join(' ').trim()}
    >
      {children}
    </article>
  );
};

export const CardHeader = ({ title, subtitle, className = '' }) => (
  <header className={`space-y-1 ${className}`.trim()}>
    {title && <h3 className="font-alternate text-[0.8rem] font-bold uppercase tracking-[0.14em] text-[#291242]">{title}</h3>}
    {subtitle && <p className="text-[0.8rem] text-slate-500 leading-relaxed">{subtitle}</p>}
  </header>
);

export const CardBody = ({ children, className = '' }) => (
  <div className={className}>{children}</div>
);

export default Card;
