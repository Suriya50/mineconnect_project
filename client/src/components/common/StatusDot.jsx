import React from 'react';

const StatusDot = ({ online, size = 'md' }) => {
  const sizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  return (
    <span className={`inline-block ${sizes[size]} rounded-full ${online ? 'bg-green-500' : 'bg-gray-400'}`} />
  );
};

export default StatusDot;