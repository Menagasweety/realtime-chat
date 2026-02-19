export function Skeleton({ lines = 3 }) {
  return (
    <div className="skeleton-wrap" role="status" aria-label="Loading">
      {Array.from({ length: lines }).map((_, i) => (
        <span key={i} className="skeleton-line" />
      ))}
    </div>
  );
}
