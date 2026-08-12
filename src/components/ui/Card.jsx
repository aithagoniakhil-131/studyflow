import React from 'react';

export const Card = ({
  children,
  className = '',
  variant = 'default',
  hover = false,
  onClick,
  ...props
}) => {
  const baseStyle = 'rounded-xl border transition-all duration-200';
  
  const variants = {
    default: 'bg-bg-card border-border-card text-text-primary',
    glass: 'glass-panel text-text-primary',
    flat: 'bg-zinc-900/40 border-border-card text-text-primary',
    outline: 'border border-border-card bg-transparent text-text-primary'
  };

  const hoverStyle = hover ? 'hover:border-brand-purple/30 hover:shadow-lg hover:shadow-brand-purple/5 hover:-translate-y-0.5 cursor-pointer' : '';

  return (
    <div
      className={`${baseStyle} ${variants[variant]} ${hoverStyle} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`p-5 pb-3 border-b border-border-card/40 flex items-center justify-between ${className}`} {...props}>
    {children}
  </div>
);

export const CardBody = ({ children, className = '', ...props }) => (
  <div className={`p-5 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '', ...props }) => (
  <div className={`p-5 pt-3 border-t border-border-card/40 flex items-center justify-between ${className}`} {...props}>
    {children}
  </div>
);
