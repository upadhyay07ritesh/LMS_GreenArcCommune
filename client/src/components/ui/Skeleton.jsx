export default function Skeleton({ 
  variant = 'default',
  className = '',
  width,
  height,
  ...props 
}) {
  const baseClass = variant === 'shimmer' ? 'skeleton-shimmer' : 'skeleton';
  
  const style = {};
  if (width) style.width = width;
  if (height) style.height = height;
  
  return (
    <div 
      className={`${baseClass} ${className}`}
      style={style}
      {...props}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="card space-y-4">
      <Skeleton variant="shimmer" className="h-48 w-full rounded-lg" />
      <div className="space-y-2">
        <Skeleton variant="shimmer" className="h-4 w-3/4" />
        <Skeleton variant="shimmer" className="h-4 w-1/2" />
      </div>
      <div className="flex gap-2">
        <Skeleton variant="shimmer" className="h-10 w-24 rounded-lg" />
        <Skeleton variant="shimmer" className="h-10 w-24 rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonText({ lines = 3 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          variant="shimmer" 
          className="h-4" 
          style={{ width: i === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  );
}