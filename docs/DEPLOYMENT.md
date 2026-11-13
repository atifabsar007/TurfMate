# Deploying the TurfMate website

The repository includes a GitHub Actions Pages workflow. After the website pull request is merged into `main`:

1. Open the repository on GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, choose **GitHub Actions** as the source.
4. Open the **Actions** tab and monitor **Deploy TurfMate website**.
5. When the workflow succeeds, GitHub Pages will show the live URL in the deployment environment.

The current release is a static front-end prototype. It does not connect to a production API, booking database, authentication provider or payment gateway. Do not collect real customer payments or promise live slot availability from this build.
