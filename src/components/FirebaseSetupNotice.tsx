const ENV_VARS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
]

export function FirebaseSetupNotice() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6">
      <div className="max-w-lg rounded-card border border-border bg-surface p-8 shadow-card">
        <h1 className="text-lg font-semibold text-ink">Firebase isn't configured yet</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Pace needs a Firebase project to handle sign-in and store your data. Add your project's
          credentials to <code className="rounded bg-soft px-1 py-0.5">.env</code> to continue.
        </p>
        <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-ink-soft">
          <li>
            Create a project at{' '}
            <a
              className="text-primary-text underline"
              href="https://console.firebase.google.com/"
              target="_blank"
              rel="noreferrer"
            >
              console.firebase.google.com
            </a>
          </li>
          <li>Add a Web App to it, then copy the config values it gives you</li>
          <li>
            Paste them into <code className="rounded bg-soft px-1 py-0.5">.env</code> at the project root
          </li>
          <li>Restart the dev server</li>
        </ol>
        <div className="mt-4 rounded-button bg-soft p-3 font-mono text-xs text-ink-soft">
          {ENV_VARS.map((name) => (
            <div key={name}>{name}=</div>
          ))}
        </div>
      </div>
    </div>
  )
}
