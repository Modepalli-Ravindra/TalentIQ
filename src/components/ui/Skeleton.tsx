import React from 'react';

interface SkeletonProps {
  className?: string;
  lines?: number;
  type?: 'text' | 'card' | 'avatar' | 'button' | 'image';
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', lines = 1, type = 'text' }) => {
  const baseClass = 'animate-pulse bg-[#27272A] rounded';

  if (type === 'card') {
    return (
      <div className={`p-5 bg-[#18181B] border border-[#27272A] rounded-2xl space-y-4 ${className}`}>
        <div className="flex items-center gap-3">
          <div className={`${baseClass} w-10 h-10 rounded-xl`} />
          <div className="space-y-2 flex-1">
            <div className={`${baseClass} h-4 w-2/3 rounded`} />
            <div className={`${baseClass} h-3 w-1/3 rounded`} />
          </div>
        </div>
        <div className="space-y-2">
          <div className={`${baseClass} h-3 w-full rounded`} />
          <div className={`${baseClass} h-3 w-5/6 rounded`} />
          <div className={`${baseClass} h-3 w-4/6 rounded`} />
        </div>
        <div className="flex gap-2">
          <div className={`${baseClass} h-6 w-16 rounded-full`} />
          <div className={`${baseClass} h-6 w-20 rounded-full`} />
          <div className={`${baseClass} h-6 w-14 rounded-full`} />
        </div>
      </div>
    );
  }

  if (type === 'avatar') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className={`${baseClass} w-10 h-10 rounded-full`} />
        <div className="space-y-2">
          <div className={`${baseClass} h-4 w-24 rounded`} />
          <div className={`${baseClass} h-3 w-32 rounded`} />
        </div>
      </div>
    );
  }

  if (type === 'button') {
    return <div className={`${baseClass} h-10 w-24 rounded-xl ${className}`} />;
  }

  if (type === 'image') {
    return <div className={`${baseClass} w-full h-48 rounded-2xl ${className}`} />;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`${baseClass} h-3 rounded`}
          style={{ width: `${85 - i * 15}%` }}
        />
      ))}
    </div>
  );
};

export const JobCardSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <Skeleton key={i} type="card" />
    ))}
  </div>
);

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6 p-8">
    <Skeleton type="card" className="h-32" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} type="card" className="h-28" />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Skeleton type="card" className="h-64" />
      <Skeleton type="card" className="h-64" />
    </div>
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 4 }) => (
  <div className="space-y-3">
    <div className={`grid grid-cols-${cols} gap-4 px-4`}>
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="animate-pulse bg-[#27272A] h-4 rounded" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className={`grid grid-cols-${cols} gap-4 px-4 py-3`}>
        {Array.from({ length: cols }).map((_, c) => (
          <div key={c} className="animate-pulse bg-[#18181B] h-4 rounded" style={{ width: `${70 + Math.random() * 25}%` }} />
        ))}
      </div>
    ))}
  </div>
);
