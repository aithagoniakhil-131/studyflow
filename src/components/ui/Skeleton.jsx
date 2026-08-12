import React from 'react';

export const Skeleton = ({ className = '', ...props }) => {
  return (
    <div
      className={`animate-pulse bg-zinc-800/50 rounded-md ${className}`}
      {...props}
    />
  );
};
