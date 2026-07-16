# AfriTranslate AI Product Documentation

_Last updated: July 16, 2026_

## 1. Product overview

AfriTranslate AI is a web platform for culturally aware translation, localization, transcription, meeting analysis, and creative content generation with a focus on African languages, dialects, and cultural context. The product combines a React/Vite client, Clerk authentication, Supabase persistence and storage, and server-side AI proxy routes for Gemini-powered workflows.

The platform is organized around three customer-facing promises:

1. **Language intelligence** — translate text, scripts, books, emails, conversations, audio, and meetings while preserving tone, dialect, sociolinguistic nuance, and cultural safety.
2. **Professional workflow support** — save translation history, manage glossaries, export meeting artifacts, administer users, and route premium features by subscription plan.
3. **Creative localization** — generate culturally grounded visual concepts, patterns, image prompts, and motion/video concepts from the unified Creative Studio.

## 2. Intended audiences

| Audience | Primary jobs-to-be-done | Relevant surfaces |
| --- | --- | --- |
| Individual translators and language workers | Produce nuanced translations, save conversations, reuse terms, and work offline for common phrases. | AI Assistant, Translation Studio, Library, Glossary Vault, Audio Transcriber |
| Creative teams and media producers | Localize scripts, develop culturally aware creative direction, generate visual assets, and prepare dubbing or storyboard support. | Script Translator, Literary Translator, Creative Studio, Motion/Visual tabs |
| Businesses and institutions | Localize email and operational communication, analyze multilingual meetings, and standardize terminology. | Email Localization, Meeting Insights, Glossary Vault, Profile/Training workflows |
| Administrators | Manage users, roles, and shared library content. | Admin Portal |
| Prospective customers | Understand product mission, use cases, social proof, pricing, policies, and contact/sales paths. | Landing page, Mission, Solutions, Stories, Pricing, Terms, Privacy, Contact |

## 3. High-level architecture

```text
Browser (React + Vite)
  ├─ Clerk React SDK for sign-in/session state
  ├─ Supabase JS client with Clerk JWT forwarding for RLS
  ├─ Client services for AI workflows
  └─ Product components under src/components

Vercel serverless API routes
  ├─ /api/bootstrap-profile         Clerk-authenticated profile bootstrap/migration
  ├─ /api/gemini-proxy              Server-only Gemini dispatcher for translation/localization AI
  ├─ /api/creative/*                Creative image, pattern, and suggestions routes
  └─ /api/meeting-insights/*        Meeting job, upload, polling, export, and download routes

Supabase
  ├─ profiles, conversations, chat_messages, library_items
  ├─ brand_glossaries and cultural_insights
  ├─ meeting_insight_jobs, meeting_insight_segments, meeting_insight_exports
  └─ Storage buckets for meeting recordings and generated exports
```

### Technology stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind-style utility classes, Framer Motion.
- **Authentication:** Clerk (`@clerk/clerk-react` on the client and `@clerk/backend` in serverless routes).
- **Database/storage:** Supabase Postgres, Row-Level Security, and Supabase Storage.
- **AI provider:** Google GenAI/Gemini through server-only API routes.
- **Document exports:** `jspdf` and `docx` for generated meeting export files.
- **Deployment targets:** Vercel is the primary target for `/api/*`; Netlify config is present but server-side environment notes are Vercel-oriented.

## 4. Authentication and user lifecycle

### Sign-in flow

1. Anonymous users see the landing experience by default.
2. CTAs such as **Log In**, **Launch Studio**, or **Get Started** switch the app into the signed-out brand/auth experience.
3. Clerk renders the sign-in/sign-up widget.
4. After Clerk authentication, the app obtains a session token and calls `/api/bootstrap-profile`.
5. The bootstrapped Supabase profile becomes the application `currentUser`.

### Profile bootstrap rules

The server-side bootstrap endpoint is the trusted source for profile creation and migration:

- The caller must provide a valid Clerk Bearer token.
- The server fetches the verified primary email directly from Clerk; it does not trust client-supplied email values.
- If a profile already exists for the Clerk `sub`, it is returned and lightly synchronized.
- If a legacy profile exists for the verified email, the endpoint migrates ownership to the Clerk user id and re-keys dependent tables.
- Otherwise, a new profile is inserted with role `user`, plan `Premium`, a trial start timestamp, and incomplete onboarding.

### Supabase authorization model

The browser Supabase client forwards a Clerk-issued token on each request so PostgREST can evaluate RLS policies against the Clerk user id. The client first attempts a Clerk Supabase JWT template and falls back to the default Clerk session token when third-party auth is configured directly in Supabase.

## 5. Plans, access control, and trials

The product uses profile-level `plan` and `role` fields for UI gating.

### User plans

| Plan | Intended role in product | Notes |
| --- | --- | --- |
| Free | Entry-level usage after trial expiry. | Locked out of most premium tools. |
| Basic | Lightweight paid usage. | Unlocks basic professional tools such as transcriber, script/book/email, and Translation Studio. |
| Premium | Main pro tier and default trial tier. | Unlocks premium conversation, creative, meeting, and glossary workflows. |
| Training | Team/training-oriented tier. | Enables the profile team-invite block. |
| Entreprise | Highest tier. | Upgrade CTA is hidden for this plan. |

### Feature gates

| Feature | Minimum access level in sidebar logic |
| --- | --- |
| AI Assistant | Basic |
| Translation Studio | Basic |
| Script Translator | Basic |
| Literary Translator | Basic |
| Audio Transcriber | Basic |
| Email Localization | Basic |
| Live Conversation | Premium |
| Creative Studio / Visual / Motion | Premium |
| Meeting Insights | Premium |
| Glossary Vault | Premium |

Premium trial access grants temporary access to premium tools. When a Premium trial expires, the app updates the profile plan to Free.

### Roles

- `user`: Normal signed-in experience.
- `admin`: The entire signed-in shell is replaced with the Admin Portal, giving access to user and library administration.

## 6. Product surfaces

### 6.1 Public landing and information pages

The public experience includes:

- **Landing/home:** Hero, metrics, demo section, trust markers, and CTAs.
- **Mission:** Brand and mission narrative.
- **Solutions:** Use-case oriented product explanation.
- **Stories:** Testimonials/social proof.
- **Terms of Service** and **Privacy Policy**.
- **Contact/Sales form**.

Public info pages are available without authentication. Non-public CTAs open the auth gate.

### 6.2 Signed-out brand/auth experience

When a visitor starts a protected flow while signed out, the app shows the brand block next to Clerk sign-in. This keeps acquisition and authentication inside the product experience while Clerk owns credential handling.

### 6.3 Onboarding Agent

Freshly bootstrapped users with `onboarding_completed = false` can be routed to onboarding. The onboarding flow collects profile context such as profession, interests, goals, and other personalization inputs before returning users to the main assistant.

### 6.4 AI Assistant

The AI Assistant is the default chat/translation workflow.

Core capabilities:

- Start a new project/conversation.
- Choose source language, target language, and tone.
- Send text, optional attachments, and optional audio source metadata.
- Receive a structured translation with direct translation, culturally aware translation, explanation, pronunciation, and optional linguistic analysis.
- Persist conversations and chat messages in Supabase.
- Load prior conversations from the sidebar history.
- Rate messages as good/bad for feedback capture.
- Display offline status and offline-translation flags.

Primary data tables:

- `conversations`
- `chat_messages`

Primary AI client function:

- `getNuancedTranslation()` through the Gemini proxy.

### 6.5 Translation Studio

Translation Studio is the advanced text translation workspace for professional users.

Capabilities include:

- Entering source text and generating culturally aware translation output.
- Applying tone/dialect-aware controls.
- Loading user glossary terms.
- Checking cultural risks and glossary compliance.
- Saving brand glossary terms for future consistency.
- Naturalizing translations into a more idiomatic target-language result.

Primary supporting service:

- `src/services/culturalService.ts`

### 6.6 Glossary Vault

Glossary Vault is a premium terminology-management surface. It lets users create, view, and delete brand glossary entries scoped to their user id. Translation Studio can load these terms to enforce brand and terminology consistency.

Primary data table:

- `brand_glossaries`

### 6.7 Script Translator

Script Translator supports media localization workflows for scripts and screenplays.

Capabilities include:

- Translating scripts into target languages.
- Generating synopsis/logline support.
- Character analysis.
- Cultural adaptation reports.
- Audience reception analysis.
- Scene breakdowns.
- Casting sides.
- Dubbing guides.
- Storyboard prompts.

Primary AI functions include:

- `translateScript()`
- `generateSynopsis()`
- `analyzeCharacters()`
- `generateCulturalReport()`
- `analyzeAudienceReception()`
- `analyzeSceneBreakdown()`
- `generateCastingSide()`
- `generateDubbingGuide()`
- `generateStoryboardPrompts()`

### 6.8 Literary Translator

Literary Translator supports long-form and book translation workflows. It focuses on preserving meaning, tone, cultural references, and literary voice across languages.

Primary AI functions include:

- `translateLiteraryText()`
- `getLiteraryContext()`
- `translateBook()`

### 6.9 Email Localization

Email Localization helps users adapt business or campaign communication for target audiences.

Capabilities include:

- Email tone analysis.
- Localized subject and body generation.
- Cultural tips to help avoid inappropriate phrasing.

Primary AI functions include:

- `analyzeEmail()`
- `localizeEmail()`

### 6.10 Audio Transcriber

Audio Transcriber supports audio-to-text and translated transcription workflows.

Capabilities include:

- Audio transcription.
- Translation of transcribed text.
- Transcription style options such as normal or interview-oriented processing.

Primary AI functions include:

- `transcribeAudio()`
- `translateTranscription()`

### 6.11 Live Conversation

Live Conversation is the premium conversational interpreting surface. It supports real-time or near-real-time translation patterns, speaker-language detection, and live translation support.

Primary AI functions include:

- `detectSpeakerLanguage()`
- `translateLive()`

### 6.12 Meeting Insights

Meeting Insights is a premium professional workflow for analyzing live, linked, uploaded, or scheduled meetings.

User journey:

1. Submit meeting details or create a job.
2. For recordings, request a signed upload URL.
3. Upload the recording directly to Supabase Storage.
4. Poll the meeting job for processing progress.
5. Review transcript segments, localized transcript, summary, language notes, risks, decisions, sentiment, and action items.
6. Export artifacts as TXT, SRT, PDF, or DOCX through server-authorized signed downloads.

Primary API routes:

- `POST /api/meeting-insights`
- `POST /api/meeting-insights/upload-url`
- `GET /api/meeting-insights/:id`
- `GET /api/meeting-insights/:id/export?format=txt|srt|pdf|docx`
- `POST /api/meeting-insights/export`

Primary tables/storage:

- `meeting_insight_jobs`
- `meeting_insight_segments`
- `meeting_insight_exports`
- Supabase Storage buckets for recordings and exports.

### 6.13 Creative Studio

Creative Studio unifies culturally aware creative generation.

Tabs/workflows:

- **Visual Arts:** Prompt-driven visual generation enriched with cultural context, avoidance notes, colors, audience, style, and use case.
- **Patterns:** SVG pattern generation for African-inspired pattern systems, including type, complexity, colors, tileability, cultural origin, and design notes.
- **Motion/Video:** Motion concept support, cultural suggestions, and preserved video generation pipeline helpers.

Primary API routes:

- `POST /api/creative/cultural-suggestions`
- `POST /api/creative/generate-image`
- `POST /api/creative/generate-pattern`

### 6.14 Library

The Library displays saved cultural/translation examples such as proverbs, idioms, words, phrases, sentences, and paragraphs. Admins can add, update, and delete shared library records through the Admin Portal.

Primary data table:

- `library_items`

### 6.15 Pricing, Payment, and Payment Success

Pricing presents plans and routes users to plan selection or sales contact. Payment captures the selected plan and updates post-payment UI state through the Payment Success surface. The current implementation is a product/UI flow; payment-provider integration should be verified separately before production billing use.

### 6.16 Profile Dashboard

The profile dashboard lets users manage profile details such as display name, profession, bio, interests, and goals. It also displays plan/account state. Training-plan users see team invite management and a read-only invite-link block.

### 6.17 Admin Portal

Admin users bypass the standard signed-in shell and enter Admin Portal. Admin capabilities include:

- Viewing all users.
- Updating user roles.
- Managing library records.
- Signing out.

Admin access requires `currentUser.role === 'admin'`.

## 7. API and service map

### 7.1 Server routes

| Route | Purpose | Auth |
| --- | --- | --- |
| `/api/bootstrap-profile` | Create, synchronize, or migrate a Supabase profile for a Clerk user. | Clerk Bearer token |
| `/api/gemini-proxy` | Server-side dispatcher for Gemini AI functions used by client services. | Route-specific request validation; Gemini key remains server-side |
| `/api/creative/cultural-suggestions` | Return cultural notes, elements, palette, symbolism, and warnings for a prompt. | Clerk token |
| `/api/creative/generate-image` | Enrich prompt and generate or gracefully fallback for images. | Clerk token |
| `/api/creative/generate-pattern` | Generate sanitized SVG pattern output with cultural metadata. | Clerk token |
| `/api/meeting-insights` | Submit a meeting insight job. | Clerk Bearer token |
| `/api/meeting-insights/upload-url` | Mint recording upload signed URL. | Clerk Bearer token |
| `/api/meeting-insights/[id]` | Poll job, transcript segments, and export records. | Clerk Bearer token and ownership check |
| `/api/meeting-insights/export` | Build/store export artifacts. | Clerk Bearer token and ownership check |
| `/api/meeting-insights/[id]/export` | Mint signed export download URL. | Clerk Bearer token and ownership check |

### 7.2 Client services

| Service | Responsibility |
| --- | --- |
| `services/geminiService.ts` | Client wrappers for translation, localization, transcription, live translation, meeting summary, script analysis, literary translation, and video operations. |
| `src/services/meetingInsightsClient.ts` | Meeting job submission, upload URL requests, direct recording upload, job polling, export URL retrieval, and polling loops. |
| `src/services/culturalService.ts` | Cultural insight persistence, brand glossary CRUD, and glossary compliance checks. |
| `services/offlineService.ts` | Offline dictionary lookup and batch offline translations for selected phrases. |
| `services/pdfGenerator.ts` | Generates an operational manual PDF. |
| `services/zoomService.ts` | Parses Zoom links and contains placeholder/auth helper functions for Zoom bot connection. |

## 8. Data model summary

### Core profile and auth

| Entity | Purpose | Important fields |
| --- | --- | --- |
| `profiles` | Application user profile mirrored from Clerk. | `id`, `email`, `name`, `role`, `plan`, `trial_start_date`, `onboarding_completed`, `bio`, `profession`, `interests`, `goals` |

### Translation and chat

| Entity | Purpose | Important fields |
| --- | --- | --- |
| `conversations` | Chat/project container. | `id`, `user_id`, `title`, `source_lang`, `target_lang`, `tone`, `created_at` |
| `chat_messages` | User and AI messages for conversations. | `id`, `conversation_id`, `role`, `originalText`, `translation`, `attachments`, `rating`, `created_at` |
| `library_items` | Shared language/culture examples. | `id`, `type`, `text`, `source`, `target`, `tone`, `meaning`, `audioUrl` |

### Professional workflows

| Entity | Purpose |
| --- | --- |
| `brand_glossaries` | User-scoped glossary terms for brand consistency. |
| `cultural_insights` | Stored cultural insights associated with translation activity. |
| `scheduled_meetings` | Meeting scheduling records used by legacy/current meeting flows. |
| `meeting_summaries` | Legacy meeting-summary ownership table included in profile migration. |

### Meeting Insights

| Entity | Purpose |
| --- | --- |
| `meeting_insight_jobs` | Job status, source metadata, progress, result JSON, summaries, language notes, errors, and timestamps. |
| `meeting_insight_segments` | Transcript/localized transcript segments with timing, speaker, language, confidence, and inaudibility flags. |
| `meeting_insight_exports` | Export records for generated TXT, SRT, PDF, and DOCX files. |

## 9. Environment variables

### Client-side `.env.local`

These values are bundled into the Vite client and must be safe for browser exposure:

```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Development should use Clerk `pk_test_...` keys. Do not put server-only secrets in `.env.local`.

### Server-side Vercel variables

These must be configured in Vercel Project Settings and must not be exposed to the browser:

```bash
GEMINI_API_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
CLERK_SECRET_KEY=...
```

## 10. Local development

1. Install dependencies.

   ```bash
   npm install
   ```

2. Create `.env.local` with client-safe Clerk and Supabase values.

3. Ensure Clerk and Supabase are configured so Supabase can validate the Clerk token used by the browser client. Either configure a Clerk Supabase JWT template or Supabase third-party auth for Clerk.

4. Start Vite.

   ```bash
   npm run dev
   ```

5. Visit the local URL printed by Vite, usually `http://localhost:3000` or `http://localhost:5173` depending on configuration.

## 11. Testing and QA checklist

### Static checks

- Build the application with `npm run build` before shipping.
- Confirm no server secrets appear in client code or `.env.local`.
- Confirm server routes read `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `CLERK_SECRET_KEY` only from `process.env`.
- Confirm any new Supabase tables have RLS policies and migrations.

### Manual smoke tests

Public/pre-auth:

- Landing page renders while signed out.
- Mission, Solutions, Stories, Terms, Privacy, and Contact render without auth.
- Protected CTA opens the brand/auth experience rather than a blank page.

Signed-in standard user:

- Profile bootstrap succeeds and creates/loads a Supabase profile.
- AI Assistant can create a conversation and persist user/AI messages.
- Sidebar history loads and can reopen a conversation.
- Plan-gated items open Upgrade Modal when unavailable.
- Profile Dashboard saves user fields.

Premium/trial user:

- Creative Studio tabs render.
- Meeting Insights can submit and poll a job.
- Glossary Vault can add/delete glossary terms.
- Live Conversation and Audio Transcriber render.

Admin user:

- Admin Portal replaces the normal shell.
- Library CRUD works.
- User role update works.

### Meeting Insights QA

- Submit a job.
- Upload recording through signed URL.
- Poll until terminal state.
- Verify transcript segments render.
- Generate each export format.
- Retrieve export signed URL through server route only.

### Creative Studio QA

- Cultural suggestions return notes, warnings, palette, and symbolism.
- Image generation handles both success and quota fallback states.
- Pattern generation returns sanitized SVG and metadata.

## 12. Security and compliance notes

- Gemini API keys are server-only and must never be bundled into Vite client code.
- Supabase service-role access is limited to serverless routes.
- `/api/bootstrap-profile` fetches verified email from Clerk and does not trust request-body identity data.
- Meeting export downloads route through the server so ownership is checked before signed URLs are minted.
- Clerk token verification rejects missing, empty, invalid, expired, and unsigned `alg=none` bearer tokens.
- RLS should remain enabled for user-scoped Supabase tables.
- Admin-only actions should continue to require profile role checks.

## 13. Product roadmap considerations

Potential next documentation and product hardening work:

- Add payment-provider integration documentation once billing is connected.
- Document exact Supabase RLS policies per table in a database reference.
- Add sequence diagrams for Meeting Insights and Creative Studio.
- Add user-facing help docs for each major workflow.
- Add an admin operations runbook for role changes, failed jobs, and support escalations.
- Add analytics/event taxonomy for activation, conversion, and feature usage.

## 14. Glossary

| Term | Meaning |
| --- | --- |
| Clerk `sub` | The authenticated Clerk user id used as the Supabase profile id. |
| Cultural risk | A phrase, symbol, or localization choice that may be inappropriate, inaccurate, or culturally insensitive for the target audience. |
| RLS | Supabase Row-Level Security, used to restrict rows to the authenticated user/role. |
| Premium trial | Default new-user access state that temporarily unlocks Premium capabilities before downgrading to Free on expiry. |
| Signed URL | Time-limited Supabase Storage URL minted by the server after ownership checks. |
