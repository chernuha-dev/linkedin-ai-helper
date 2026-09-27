# Privacy Policy — DevOps Writing Helper

Last updated: September 28, 2026

DevOps Writing Helper is a personal application run locally on the user's computer. It helps draft professional posts and comments, and can publish a post to the user's LinkedIn account only after the user reviews and explicitly confirms the final text.

## Information processed

- Notes, answers, draft text, and text of posts supplied by the user are sent to the AI provider selected in the application: Codex through the user's ChatGPT sign-in, or the OpenAI API through the user's own API key.
- If the user connects LinkedIn, the application receives an OAuth access token and basic profile information needed to publish on that user's behalf.
- When the user confirms publication, the final post text is sent to LinkedIn. Suggested comments are copied by the user and are not posted automatically by this application.

## Storage and retention

The application does not store notes, drafts, or LinkedIn access tokens in a database or on disk. The LinkedIn token is held in the local server's memory until the user disconnects, the token expires, or the application restarts. Optional API keys and LinkedIn application credentials are kept in the user's local `.env` file. The Codex CLI manages its own ChatGPT sign-in credentials separately from this application.

The AI provider and LinkedIn process information under their own terms and privacy policies. Published posts remain on LinkedIn until the user removes them there.

## Tracking and sharing

The application does not include advertising, analytics, or tracking cookies. It does not sell personal information. Data is sent only to the selected AI provider and to LinkedIn for the functions described above.

## User control

The user can edit or discard any draft. Publication requires an explicit confirmation. Disconnecting LinkedIn deletes the token from the application's memory; restarting the application also clears it. To remove a published post, the user must delete it on LinkedIn.

## Contact

For privacy questions, contact the maintainer through [GitHub Issues](https://github.com/chernuha-dev/linkedin-ai-helper/issues). Do not include private data or credentials in a public issue.
