import React from 'react';

const BASE_BUTTON_CLASS = 'inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-[0.75rem] font-bold uppercase tracking-widest font-alternate transition-all duration-300 group disabled:pointer-events-none disabled:opacity-60';

const BUTTON_VARIANTS = {
  primary: 'bg-[#00DA5E] text-[#291242] hover:bg-white border border-transparent hover:border-slate-200 shadow-sm active:scale-95',
  secondary: 'bg-[#291242] text-white hover:bg-[#6100D7] shadow-md active:scale-95',
  outline: 'bg-transparent border border-[#00DA5E] text-[#00DA5E] hover:bg-[#00DA5E] hover:text-[#291242] active:scale-95',
  outlineDark: 'bg-transparent border border-slate-200 text-slate-800 hover:border-[#291242] hover:text-[#291242] active:scale-95',
  ghost: 'bg-white/5 border border-white/20 text-white hover:bg-white/15 backdrop-blur-sm active:scale-95',
  soft: 'bg-[#F4F7F8] border border-transparent text-[#291242] hover:border-[#291242]/20 hover:bg-white active:scale-95',
};

const BUTTON_SIZES = {
  sm: 'px-4 py-2.5 text-[0.68rem]',
  md: 'px-6 py-3 text-[0.75rem]',
  lg: 'px-7 py-3.5 text-[0.8rem]',
};

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  icon: Icon,
  iconPosition = 'right',
  ...props
}) => {
  const iconNode = Icon
    ? <Icon size={14} strokeWidth={2.4} className="transition-transform group-hover:translate-x-1" />
    : null;

  return (
    <button
      type="button"
      className={`${BASE_BUTTON_CLASS} ${BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.primary} ${BUTTON_SIZES[size] || BUTTON_SIZES.md} ${className}`.trim()}
      {...props}
    >
      {iconPosition === 'left' && iconNode}
      <span>{children}</span>
      {iconPosition === 'right' && iconNode}
    </button>
  );
};

export default Button;
