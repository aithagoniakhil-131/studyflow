import React from 'react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  ...props
}) => {
  const baseStyle = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-brand-purple hover:bg-brand-purple-hover text-white shadow-md shadow-brand-purple/10 active:scale-98',
    secondary: 'border border-border-card text-text-primary bg-transparent hover:bg-zinc-800/30 active:scale-98',
    glass: 'glass-card hover:bg-zinc-800/60 border-border-card text-text-primary active:scale-98',
    danger: 'bg-priority-high/20 border border-priority-high/40 hover:bg-priority-high/30 text-priority-high active:scale-98',
    ghost: 'text-text-muted hover:text-text-primary hover:bg-zinc-800/20 active:scale-98'
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-6 py-3 gap-2.5'
  };

  return (
    <button
      type={type}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};
