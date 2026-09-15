export function LoadingScreen() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-canvas">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
        <span className="h-2 w-2 animate-pulse rounded-full bg-primary [animation-delay:150ms]" />
        <span className="h-2 w-2 animate-pulse rounded-full bg-primary [animation-delay:300ms]" />
      </div>
    </div>
  )
}
