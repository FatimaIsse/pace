import { LegalLayout } from './LegalLayout'

export function Terms() {
  return (
    <LegalLayout title="Terms of Service" updated="September 3, 2026">
      <p>By creating an account or using Pace, you agree to these terms.</p>

      <div>
        <h2>The service</h2>
        <p>
          Pace is a personal task, habit, and goal planning tool. It's provided as-is, and we may
          add, change, or remove features over time.
        </p>
      </div>

      <div>
        <h2>Your account</h2>
        <p>
          You're responsible for the accuracy of the information you provide and for keeping your
          login credentials secure. Let us know if you believe your account has been accessed
          without your permission.
        </p>
      </div>

      <div>
        <h2>Acceptable use</h2>
        <p>
          Use Pace for its intended purpose. Don't attempt to disrupt the service, access another
          user's data, or use the app for anything illegal.
        </p>
      </div>

      <div>
        <h2>Your content</h2>
        <p>
          You own everything you create in Pace — your tasks, notes, and other entries. We store
          and process it solely to provide the app to you.
        </p>
      </div>

      <div>
        <h2>Ending your account</h2>
        <p>
          You can delete your account at any time from <strong>Me → Delete account</strong>, which
          permanently removes your data. We may suspend or terminate accounts that violate these
          terms.
        </p>
      </div>

      <div>
        <h2>No warranty</h2>
        <p>
          Pace is provided "as is," without warranties of any kind. We don't guarantee the service
          will be uninterrupted, error-free, or suitable for any particular purpose.
        </p>
      </div>

      <div>
        <h2>Limitation of liability</h2>
        <p>
          To the extent permitted by law, we aren't liable for indirect, incidental, or
          consequential damages arising from your use of Pace.
        </p>
      </div>

      <div>
        <h2>Changes to these terms</h2>
        <p>If these terms change, we'll update the date at the top of this page.</p>
      </div>

      <div>
        <h2>Governing law</h2>
        <p>These terms are governed by the laws of [your jurisdiction].</p>
      </div>

      <div>
        <h2>Contact</h2>
        <p>Questions about these terms can be sent to [your contact email].</p>
      </div>
    </LegalLayout>
  )
}
