import React from 'react';

interface CardProps {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ className = '', children, onClick }) => {
  return (
    <div 
      className={`bg-slate-900 border border-slate-800 rounded-xl overflow-hidden ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};