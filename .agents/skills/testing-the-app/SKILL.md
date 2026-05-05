---
name: afritanslate-testing
description: Testing patterns for AfriTranslate — how to reach each branded surface, what surfaces are signed-in vs pre-auth, the Clerk external-redirect gotcha, plan/role gating on signed-in UI, and the asset-equivalent test pattern. Use this before writing a test plan.
---

# Testing AfriTranslate

## Surface reachability

| Surface | Auth needed? | How to reach |
|---|---|---|
| LandingPage (incl. nav logo) | No | `http://localhost:3000/` is the unauth default. |
| Public info pages (Mission, Solutions, Stories, Terms, Privacy) | No | Click links in the LandingPage header/footer. |
| Signed-out brand block + Clerk SignIn widget | No | From LandingPage, click any non-public-info CTA — "Log In", "Launch Studio", "Get Started". This calls `onStart('chat')` → `appState.show=true, initialView='chat'` → satisfies the gate at `src/App.tsx:906` (`!PUBLIC_INFO_VIEWS.includes(initialView)`) and renders the side-by-side brand block + Clerk widget on `bg #0a0a0a`. |
| Sidebar, Header, Translator chat, Creative Studio, etc. | Yes (Clerk + real Supabase) | Sign in via the Clerk widget. **Bootstrap profile requires real Supabase creds in `.env.local`** — see `local-dev/SKILL.md` for the placeholder-Supabase trap. |
| OnboardingAgent | Yes (fresh signup) | Triggered when `wasJustSignedUpRef.current && !currentUser.onboarding_completed` (`src/App.tsx:875`). Hard to reproduce except via a brand-new email. |
| ProfileDashboard team-invite block + readonly invite-link input | Yes + `user.plan === 'Training'` | Gated at `src/components/ProfileDashboard.tsx:241`. The bootstrap insert at `src/App.tsx:818-819` hard-codes `plan: 'Premium'`, so newly bootstrapped accounts will not reach this surface at runtime. To test it, flip the row's `plan` to `Training` in Supabase before navigating to My Profile. |
| AdminPortal | Yes + `currentUser.role === 'admin'` | Gated at `src/App.tsx:444`. Bootstrap insert hard-codes `role: 'user'`, so the surface is admin-only and unreachable to a regular Clerk dev account. Use asset-equivalent shell-grep below. |

## Clerk external-redirect gotcha (Devin Chrome wrapper)

Clicking Clerk's "Sign up" link (or "Forgot password"/social-login fallbacks) on the dev SignIn widget can navigate to an external `https://*.accounts.dev/...` URL. **The Devin Chrome wrapper has been observed to close** when this happens, and `google-chrome` then exits with code 7 on relaunch — i.e. you lose your browser for the rest of the session.

Mitigations:

1. **Email/password sign-up**: configure the Clerk Development instance to allow `email_address + password` sign-up via the embedded form. Then "Sign up" stays inside `/?#/sign-up` and you don't navigate to `accounts.dev`. https://dashboard.clerk.com → Authentication → Email, Phone, Username → enable Email address + Password.
2. **Test against a deployed preview** instead of localhost when you need to exercise signed-in surfaces and the Clerk dev instance is sign-up-redirect only.
3. **Don't click "Sign up"** from the test plan unless the configuration is known to keep it in-app.

## Plan/role-gated UI — testing strategy

Many signed-in surfaces are gated by `currentUser.role` or `user.plan` checks that newly bootstrapped accounts will not satisfy. The bootstrap insert at `src/App.tsx:812-822` always creates `role: 'user'`, `plan: 'Premium'`, `onboarding_completed: false`. So:

- An admin-only surface (`role === 'admin'`) cannot be reached without a Supabase update.
- A Training-plan surface (`plan === 'Training'`) cannot be reached without a Supabase update.
- A no-onboarding surface (`!onboarding_completed && wasJustSignedUpRef.current`) is only reachable on the **first** sign-in for a fresh email — once it's reset, it's gone for that account.

When the change under test lives behind a gate the test account can't pass, choose one of:

1. **Flip the row in Supabase** for that one Clerk user (e.g. `update profiles set plan='Training' where id='<clerkUserId>'`). Most invasive; only do this when runtime verification is genuinely required and asset-equivalent isn't enough.
2. **Asset-equivalent shell-grep + Tailwind-compile-runtime-proof** — see next section.

## Asset-equivalent test pattern

When a fix lives in a single shared static asset (an SVG in `/public/`, a Tailwind className on a component used in N places, a CSS rule on a class used by multiple inputs), the dispositive test set is:

1. **Source level**: `grep` the relevant file/line and assert the bytes contain the fix and not the broken value.
2. **Tailwind/CSS compile-runtime proof on a comparable surface**: find any visible element on the same kind of background that uses the same Tailwind class (or the same CSS rule), open DevTools → Computed, and assert the computed `color` matches the expected value. This proves the build pipeline emits the right CSS for that class on this app's bg, regardless of which component instance it's applied to.

Unreached sites that reference the same byte-identical asset/class are then **untested-but-asset-equivalent**: there is no rendering path by which they could differ from the verified surfaces unless a consumer-site bug (broken `<img src>`, stylesheet override hiding text, etc.) is in play — and that's a separate class of bug from the asset-level fix.

Mark these unreached sites explicitly in the report rather than silently skipping them. Cite the verified surfaces' contrast envelopes to justify the equivalence (e.g. `#e5e5e5` on `#121212` ≈ 14:1, so any parent bg between `#0a0a0a` and `#171717` is implicitly covered).

Worked example from PR #7 (security: F-01..F-05 + input contrast):

- Change: `ProfileDashboard.tsx:281` invite-link input class `text-text-secondary` → `text-white`.
- Plan-gated: invite-link is only rendered when `user.plan === 'Training'` (line 241) — the Premium-trial bootstrap account never reaches it.
- Asset-equivalent verification: `grep -n text-white src/components/ProfileDashboard.tsx` confirmed the merged class on line 281; on the same page the visible Display Name input also uses `text-white` and DevTools Computed reported `color: rgb(255, 255, 255)` on `bg: rgb(18, 18, 18)`. Combination is dispositive for the gated invite-link input on the same page.

## Vercel preview URLs

The `linfordlee14/afritanslate` fork does not have Vercel CI/CD wired (CI is just Devin Review). Don't waste time looking for a preview URL on PRs — there isn't one. If you need a deployed preview, you'll have to ask the user to deploy the branch under the Clerk-registered domain (`studio.afritranslate.co.za` for production keys).

This also means the runtime behaviour of CSP / X-Frame-Options / referrer / CORS headers in `vercel.json` cannot be observed locally. Verify static-file content of `vercel.json` and `index.html` and explicitly mark runtime-on-Vercel as out-of-scope in the test report.
