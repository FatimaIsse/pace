import { LegalLayout } from './LegalLayout'

export function Privacy() {
  return (
    <LegalLayout title="Privacy Policy" updated="September 3, 2026">
      <p>
        Pace ("we", "us", "the app") is a personal planning tool. This page explains what
        information we collect, why, and how you can remove it.
      </p>

      <div>
        <h2>Information we collect</h2>
        <ul>
          <li>
            <strong>Account information:</strong> your name and email address, provided when you
            sign up with email/password or with Google.
          </li>
          <li>
            <strong>Content you create:</strong> tasks, projects, habits, goals, check-ins, brain
            dump entries, and preferences you enter while using Pace.
          </li>
        </ul>
        <p className="mt-2">We don't collect anything beyond what's needed to run the app — no ad identifiers, no third-party analytics or trackers.</p>
      </div>

      <div>
        <h2>How we use it</h2>
        <p>
          Your information is used only to provide the app itself: storing and syncing your
          planning data across your devices, and lightly personalizing what Pace shows you (for
          example, tailoring a message based on what you said during onboarding). We do not sell
          your data, and we do not use it for advertising.
        </p>
      </div>

      <div>
        <h2>Where your data lives</h2>
        <p>
          Pace stores your data using Google Firebase (Authentication and Cloud Firestore).
          Firebase's own security rules restrict every piece of your data so that only your signed-in
          account can read or write it — no other user can access it. Google's handling of this
          infrastructure is governed by{' '}
          <a
            className="text-primary underline"
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noreferrer"
          >
            Google's Privacy Policy
          </a>
          .
        </p>
      </div>

      <div>
        <h2>How long we keep it</h2>
        <p>
          We keep your data for as long as your account exists. You can permanently delete your
          account and everything in it at any time from <strong>Me → Delete account</strong>. This
          removes your tasks, projects, habits, goals, and profile immediately, along with your
          login credentials — it can't be undone.
        </p>
      </div>

      <div>
        <h2>Children's privacy</h2>
        <p>Pace is not directed at children under 13, and we don't knowingly collect information from them.</p>
      </div>

      <div>
        <h2>Changes to this policy</h2>
        <p>If this policy changes, we'll update the date at the top of this page.</p>
      </div>

      <div>
        <h2>Contact</h2>
        <p>Questions about this policy or your data can be sent to [your contact email].</p>
      </div>
    </LegalLayout>
  )
}
