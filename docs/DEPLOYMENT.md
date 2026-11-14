# Deploying the TurfMate website

The repository includes a GitHub Actions Pages workflow. After the website pull request is merged into `main`:

1. Open the repository on GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, choose **GitHub Actions** as the source.
4. Open the **Actions** tab and monitor **Deploy TurfMate website**.
5. When the workflow succeeds, GitHub Pages will show the live URL in the deployment environment.

The current release is a static front-end prototype. Player accounts use browser-local storage and PBKDF2 password hashes; this is for demos only and is not server authentication. Booking enquiries, tournament interest and partner forms are saved locally and are not sent to external organisations. A production launch still needs a secure backend, account recovery, server-side validation, verified venue calendars and payment integration. Do not collect real customer payments or promise live slot availability from this build.


## Step 7 — Supabase backend setup

The website remains compatible with local demo mode until Supabase credentials are configured.

1. Create a Supabase project and run `supabase/migrations/202611140001_turfmate_cloud_backend.sql` in its SQL Editor.
2. Copy `backend-config.example.js` to `backend-config.js`.
3. Fill in `supabaseUrl` and the anon/publishable key only. Never add a service-role/secret key.
4. Configure Auth Site URL, redirect URLs, email confirmation and SMTP.
5. Deploy with GitHub Pages and test registration, profile photo upload, match creation/joining/scoring, invitations and notifications using two accounts.

Cloud mode is not active until the project URL and public key are supplied. The SQL migration and browser adapter are provided; no Supabase project or production credentials are created by this repository change.
