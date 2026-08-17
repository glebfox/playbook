# 0005 — Auth.js rather than a hand-rolled session

**Status:** accepted

## Context

Two users, one of whom is not technical, and a login that must survive a phone browser being closed for a week. Writing session handling by hand is a small amount of code and an unbounded amount of responsibility — rotation, fixation, cookie flags, password reset.

## Decision

Auth.js v5 with a database session store, credentials for the two accounts and Google as a convenience provider. No custom session table, no custom token format.

## Consequences

- Sign-in, sign-out and session refresh are library behavior, not project behavior.
- The session shape is the library's, so anything the app wants on it goes through the session callback.
- Upgrading the library is a security task, not a chore, and gets read release notes.
