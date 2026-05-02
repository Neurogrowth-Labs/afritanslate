---
name: afritanslate-testing
description: Testing patterns for AfriTranslate — how to reach each branded surface, what surfaces are signed-in vs pre-auth, the Clerk external-redirect gotcha, and the asset-equivalent test pattern. Use this before writing a test plan.
---

# Testing AfriTranslate

## Surface reachability

| Surface | Auth needed? | How to reach |
|---|---|---|
| LandingPage (incl. nav logo) | No | `http://localhost:3000/` is the unauth default. |
| Public info pages (Mission, Solutions, Stories, Terms, Privacy) | No | Click links in the LandingPage header/footer. |
| Signed-out brand block + Clerk SignIn widget | No | From LandingPage, click any non-public-info CTA — "Log In", "Launch Studio", "Get Started". This calls `onStart('chat')` → `appState.show=true, initialView='chat'` → satisfies the gate at `src/App.tsx:906` (`!PUBLIC_INFO_VIEWS.includes(initialView)`) and renders the side-by-side brand block + Clerk widget on `bg #0a0a0a`. |
| Sidebar, Header, Translator chat, Creative Studio, etc. | Yes (Clerk) | Sign in / sign up via the Clerk widget. |
| OnboardingAgent | Yes (fresh signup) | Triggered when `wasJustSignedUpRef.current && !currentUser.onboarding_completed` (`src/App.tsx:875`). Hard to reproduce except via a brand-new email. |

## Clerk external-redirect gotcha (Devin Chrome wrapper)

Clicking Clerk's "Sign up" link (or "Forgot password"/social-login fallbacks) on the dev SignIn widget can navigate to an external `https://*.accounts.dev/...` URL. **The Devin Chrome wrapper has been observed to close** when this happens, and `google-chrome` then exits with code 7 on relaunch — i.e. you lose your browser for the rest of the session.

Mitigations:

1. **Email/password sign-up**: configure the Clerk Development instance to allow `email_address + password` sign-up via the embedded form. Then "Sign up" stays inside `/?#/sign-up` and you don't navigate to `accounts.dev`. https://dashboard.clerk.com → Authentication → Email, Phone, Username → enable Email address + Password.
2. **Test against a deployed preview** instead of localhost when you need to exercise signed-in surfaces and the Clerk dev instance is sign-up-redirect only.
3. **Don't click "Sign up"** from the test plan unless the configuration is known to keep it in-app.

## Asset-equivalent test pattern

When a fix lives in a single shared static asset (e.g. an SVG in `/public/`) that's referenced from N component sites via `<img src="...">`, the dispositive test set is:

1. **Asset level**: `curl http://localhost:3000/<asset>` and assert the bytes contain the fix and not the broken value.
2. **Render level**: visually confirm the fix on a representative subset of the surfaces that exercises the most stringent constraint (e.g. lowest contrast, largest size, third-party iframe).

Unreached sites that reference the same byte-identical asset are then **untested-but-asset-equivalent**: there is no rendering path by which they could differ from the verified surfaces unless a consumer-site bug (broken `<img src>`, stylesheet override hiding text, etc.) is in play — and that's a separate class of bug from the asset-level fix.

Mark these unreached sites explicitly in the report rather than silently skipping them. Cite the verified surfaces' contrast envelopes to justify the equivalence (e.g. `#e5e5e5` on `#121212` ≈ 14:1, so any parent bg between `#0a0a0a` and `#171717` is implicitly covered).

## Vercel preview URLs

The `linfordlee14/afritanslate` fork does not have Vercel CI/CD wired (CI is just Devin Review). Don't waste time looking for a preview URL on PRs — there isn't one. If you need a deployed preview, you'll have to ask the user to deploy the branch under the Clerk-registered domain (`studio.afritranslate.co.za` for production keys).
