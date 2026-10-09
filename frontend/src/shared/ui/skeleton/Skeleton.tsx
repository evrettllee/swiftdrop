type SkeletonProps = {
  // The size and the corners of the placeholder, for example "h-5 w-32 rounded-sm".
  className: string;
};

// A grey block in the place of a content that is still loading.
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse bg-field [animation-duration:1.6s] motion-reduce:animate-none ${className}`}
    />
  );
}
