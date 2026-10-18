# Reviewer Video Storyboard — Accessibility API resubmission

Google's rejection email requires a **new video with every resubmission**:

> "Please remember to include in the Play Console, a link to an updated video
> showcasing the core functionality feature that uses the AccessibilityService
> API with each new app submission."

A reused video from a prior round is grounds for rejection. Record a fresh one
on the build that carries the updated disclosure text. No video is committed to
this repository — record and upload it.

Target: under 2 minutes, silent or with on-screen captions, phone screen + taps.

---

| # | Beat | What must be visible | What the reviewer should note |
|---|------|----------------------|-------------------------------|
| 1 | Disclosure with NEW text | Open Deep Lock → the AccessibilityDisclosure modal. **Scroll slowly** so the section labels **Other personal info** and **Other user-generated content** are clearly readable on screen | Both policy-standard data-type labels are named in the prominent disclosure, with their collection descriptions |
| 2 | Consent → Settings → enable | Tap "Allow Deep Lock" → Android Accessibility Settings opens → toggle the Student OS service ON → return to app | Consent precedes the system prompt; grant happens in native Settings |
| 3 | Start a focus session | Start a Focus session with Deep Lock enabled | Session active, protection on |
| 4 | Open a blocked app | Switch to a blocked (non-whitelisted) app → the block screen appears | Foreground app detection works during the session |
| 5 | Distraction log in-app | Return to Student OS → open the distraction log → show a logged entry with **app name + timestamp** | Visually proves what "Other user-generated content" means: user-facing history |
| 6 | Clear all data wipes the log | Settings → Data → Clear all data → reopen the distraction log → it is empty | User control: collection is revocable and erasable on-device |

---

## Recording notes
- Use a device with a real Google account (usage-access screen requires it).
- If a fresh install isn't possible during recording, wipe app data first
  (Settings → Apps → Student OS → Clear storage) so onboarding shows.
- Keep the Disclosure modal fully in frame during beat 1 — this beat is the
  one Google specifically checks.
- Record the video on the **same build** you submit; a build mismatch between
  the video and the APK/AAB is a common rejection cause.

## To do (developer)
- [ ] Record video on the new build following these 6 beats
- [ ] Upload to Play Console → App content → Reviewer video (this submission's own link)
