# Security Policy

## Reporting a Vulnerability

Please **do not** report security vulnerabilities through public GitHub issues.

Instead, use GitHub's [private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability):

1. Go to the **Security** tab of this repository.
2. Click **Report a vulnerability**.
3. Provide a description, reproduction steps, and any relevant details.

You can expect an acknowledgement within a few days. Please give us a
reasonable amount of time to address the issue before any public disclosure.

## Scope & Design Notes

Student OS is a **local-first, offline** application:

- There is no backend, no account system, and no data transmission.
- All user data is stored in the browser (`localStorage` / IndexedDB) on the user's device.
- The Android **Accessibility Service** is used only to detect the foreground app during a
  Deep Lock focus session. It does not read screen content, messages, passwords, or input.

For the full security model, see [`../docs/SECURITY.md`](../docs/SECURITY.md).
