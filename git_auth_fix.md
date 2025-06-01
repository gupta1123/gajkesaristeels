# Git Authentication Issue and Solution

## Problem

When attempting to push changes to the GitHub repository (`https://github.com/gupta1123/gajkesaristeels.git`), the operation would fail with a 403 Forbidden error:

```
remote: Permission to gupta1123/gajkesaristeels.git denied to shubhamtribhuwan171.
fatal: unable to access 'https://github.com/gupta1123/gajkesaristeels.git/': The requested URL returned error: 403
```

This indicated that Git was attempting to authenticate as user `shubhamtribhuwan171`, who did not have the necessary write permissions for the repository, even though the intended user was different (e.g., `gupta1123`).

Attempts to resolve this included:
*   Clearing cached credentials (e.g., from macOS Keychain).
*   Explicitly setting the Git credential helper to `osxkeychain` for the repository (`git config credential.helper osxkeychain`).
*   Temporarily modifying the remote URL to force a credential prompt (e.g., `https://user@github.com/...`). While this worked once, reverting the URL caused the issue to reappear.

The root cause appeared to be stale or incorrectly cached credentials at a system or Git level that were being picked up for the standard HTTPS remote URL, incorrectly identifying the user as `shubhamtribhuwan171`.

## Solution

The most reliable solution was to make the intended username explicit in the remote repository URL. This bypasses ambiguous credential lookups and forces Git to authenticate as the specified user.

1.  **Set the remote URL to include the correct username:**
    Replace `USERNAME`, `OWNER`, and `REPO` with your specific details. In this case, `USERNAME` was `gupta1123`, `OWNER` was `gupta1123`, and `REPO` was `gajkesaristeels`.

    ```bash
    git remote set-url origin https://USERNAME@github.com/OWNER/REPO.git
    ```
    For this specific case, the command was:
    ```bash
    git remote set-url origin https://gupta1123@github.com/gupta1123/gajkesaristeels.git
    ```

2.  **Push to the repository:**
    ```bash
    git push origin main
    ```

3.  **Authentication Prompt:**
    Git should then prompt for the password for `USERNAME@github.com`.
    *   **Important:** Use a **Personal Access Token (PAT)** with appropriate scopes (e.g., `repo`) as the password, not your regular GitHub account password.

This configuration ensures that Git always attempts to authenticate with the correct user account for this repository, and the macOS Keychain (or other credential helper) should cache the PAT correctly for this specific user-embedded URL. 