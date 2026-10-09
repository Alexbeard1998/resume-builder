interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className = '' }: SkeletonProps) => {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-800 rounded ${className}`}
    />
  );
};

// Готовый скелетон для карточки резюме
export const ResumeCardSkeleton = () => {
  return (
    <div className="card">
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-4" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  );
};

// Скелетон для дашборда
export const DashboardSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <ResumeCardSkeleton key={i} />
      ))}
    </div>
  );
};

// Скелетон для карточки в каталоге
export const ExploreCardSkeleton = () => {
  return (
    <div className="card">
      <Skeleton className="h-5 w-2/3 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-3" />
      <Skeleton className="h-3 w-1/3 mb-4" />
      <Skeleton className="h-3 w-full mb-1" />
      <Skeleton className="h-3 w-full mb-1" />
      <Skeleton className="h-3 w-2/3 mb-4" />
      <div className="flex gap-1">
        <Skeleton className="h-6 w-16 rounded" />
        <Skeleton className="h-6 w-20 rounded" />
        <Skeleton className="h-6 w-14 rounded" />
      </div>
    </div>
  );
};

// Скелетон для всего каталога
export const ExploreSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <ExploreCardSkeleton key={i} />
      ))}
    </div>
  );
};