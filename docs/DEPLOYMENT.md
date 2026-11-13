# Deploying the TurfMate website

The repository includes a GitHub Actions Pages workflow. After the website pull request is merged into `main`:

1. Open the repository on GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, choose **GitHub Actions** as the source.
4. Open the **Actions** tab and monitor **Deploy TurfMate website**.
5. When the workflow succeeds, GitHub Pages will show the live URL in the deployment environment.

The current release is a static front-end prototype. Player accounts use browser-local storage and PBKDF2 password hashes; this is for demos only and is not server authentication. Booking enquiries, tournament interest and partner forms are saved locally and are not sent to external organisations. A production launch still needs a secure backend, account recovery, server-side validation, verified venue calendars and payment integration. Do not collect real customer payments or promise live slot availability from this build.
