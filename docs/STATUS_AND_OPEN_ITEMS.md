# Promise Fertility HMIS — Status and Open Items

Source documents: Medics IVF Part 1 documentation and Medics Prime reverse-engineering document (both screen-recording based).
Stack: Next.js 16 (Vercel) + Supabase (Postgres, Auth, Storage, RLS), project `zptxewfmzcsbgjbbqbsl` (ap-south-1).

## What was verified (actually executed)
- `tsc --noEmit`, `next build` (24 routes) and `eslint` all pass.
- Database rules tested in a rolled-back transaction: unique stimulation day per cycle, bill total auto-calculation,
  issued bills locked, receipts cannot exceed balance, bill status partial -> paid, audit rows written.
- Login page served by the dev server.

## NOT yet verified
- Authenticated UI flows in a browser (no account existed; the first sign-up becomes admin and should be the clinic owner).
- Row-level-security behaviour per role from the browser (policies exist and are enforced in Postgres, but each role has not been exercised end to end).
- Real iPad rendering (layouts are responsive and use 44px targets, but no device test has been done).
- Backups / restore drill, load testing, accessibility audit.

## Module status
| Module (source label) | Status |
|---|---|
| Shell: sidebar, favourites, recently used, workspace tabs, search, role-aware nav | Built |
| Register Patient Visit, Select Patient (MRN/name/phone), duplicate warning, photo/ID upload | Built |
| Patient EMR: visits timeline (sort, sign), forms and history, cycles, consents, documents, bills | Built |
| Template engine: Patient History (obstetric, past, surgical, treatment, diet, general), USG, Gynecology Assessment (partial) | Built; field-level configure actions built |
| Document Templates library + Configure + CREATE TEMPLATE | Built |
| IVF couple/cycle overview, stimulation monitoring, daily result entry, repeat dosage | Built |
| OPU, outcomes (Record Outcome), oocyte/fertilisation counts | Built |
| Semen collection / Wash Semen Sample | Built (manual totals; no calculations) |
| Fertilisation, Monitor Embryos grid (conventional IVF/ICSI), growth, image attach | Built |
| Vitrify, Thaw, Renew, PGD send/receive, View vitrified embryos/oocytes, IVF Storage config | Built |
| Consent library, consent status, counselling notes | Built |
| Donors: match/view ovum and semen, donor fertilisation lists | Built (minimal donor profile) |
| Billing: bills, items, issue, receipts, My Today's Bills/Receipts, vitrification bills | Built |
| Drug Formulary, Record Opening Stock | Built |
| IVF Dashboard and 90 Day Conversion | Built (definitions need clinic sign-off) |
| Reports, Analytics, Data Export (audited), Settings (users/roles), Audit log | Built |
| Hospital Surgeries for Today, Patients for OPU/ET/IUI, Prepare Embryos worklists | Built (status-based rules are proposals) |

## Unresolved items needing the clinic or higher-resolution source
1. Semen analysis macroscopic / microscopic fields and reference ranges (source too small to read). Stored as free text for now.
2. Case Sheet fields (almost entirely unreadable). Placeholder single-field template.
3. Gynecology Assessment: only the readable subset of ~35 items is captured.
4. Computed Cycle Day formula: implemented as days since LMP + 1, flagged "pending verification".
5. Complete consent-form catalogue (12 names captured; files not supplied). Upload the PDFs in Consent Forms.
6. Document template rows with uncertain column alignment in the source; only 4 clinic templates are seeded, not the full demo list.
7. Dropdown option lists not shown in source (embryo survival, clinical pregnancy location, treatment types, visit types, billing categories, storage rules). Current values are marked "proposed" in `src/lib/consts.ts` and code comments.
8. Storage capacity and container/colour rules; vitrification renewal period (1 year proposed) and renewal window (60 days proposed).
9. Success/failure definitions for the dashboard and what counts as an IUI-to-IVF conversion.
10. Role matrix: current permissions are in the SQL policies (migration `core_schema`). Confirm per role before go-live.
11. Mandatory identity documents, MFA, session timeout, IP allow-listing, data residency and backup policy.
12. Original Medics branding was not copied; Promise Fertility branding is a placeholder logo.

## Security notes
- Row-level security is on for every table; all writes are role-restricted in Postgres, not only in the UI.
- New sign-ups are inactive until an admin approves them (first user becomes admin).
- Documents are in a private bucket and opened via short-lived signed URLs.
- Audit triggers record every insert/update/delete; the log is admin-readable only and cannot be edited by users.
- Before go-live: enable leaked-password protection and MFA in Supabase Auth, set the site URL, enable point-in-time recovery (paid plan), and review the Supabase advisors.
