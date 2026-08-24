export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white/80 backdrop-blur supports-backdrop-filter:bg-white/60">
      <div className="flex flex-col items-center gap-4">
        <div
          aria-hidden
          className="w-16 h-16 rounded-full border-4 border-gray-200 border-t-gray-800 dark:border-t-gray-200 animate-spin"
          style={{ borderTopColor: "#0f172a" }}
        />
        <div className="text-sm text-gray-700">Loading…</div>
      </div>
    </div>
  );
}
