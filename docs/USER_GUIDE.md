# Promise Fertility — How to Use

A practical guide for clinic staff using the Promise Fertility HMIS. It follows the order you'd actually work in a day: sign in → register patients → run the IVF cycle → bill → review.

> The app is **tablet-first** — it works on iPad (portrait and landscape), tablets and desktop. On iPad, open the site in Safari and use **Share → Add to Home Screen** to run it full-screen like an app.

---

## 1. Getting started

### Signing in
1. Open the app URL. You'll see the **sign-in** screen.
2. Enter your email and password and tap **Sign in**.

### First-time setup (administrator)
- The **very first account** created becomes the **Administrator**.
- Everyone who signs up afterwards is **inactive** until an admin approves them — this keeps patient data private.

### Adding staff (admin) — two ways
**A. Create the account for them (recommended):**
1. **Settings → Users → Add staff**.
2. Enter their name, email, **role** and **location**. A strong temporary password is generated (or type your own).
3. **Create account** → copy the email + password and share it with them. They sign in and can change the password afterwards.

**B. Let them self-register:** they tap *Create an account* on the login screen, then in **Settings → Users** you tap **Activate** and choose their **Role**.

You can also, per user: change their **Role** or **Location**, **Deactivate** them, **Password** (set a new one), or **Remove** the account. You can't change or delete your own account's role (a safeguard).

Roles control what each person can see and do:

| Role | Typical access |
|---|---|
| **Admin** | Everything, incl. Settings, Users, Audit log, Setup |
| **Doctor** | Clinical records, cycles, reports, templates |
| **Nurse** | Patients, visits, cycles, stimulation, inventory |
| **Embryologist** | Embryology, semen, vitrification, storage, PGD |
| **Lab** | Lab/embryology records |
| **Front Desk** | Registration, appointments, documents, billing |
| **Billing** | Bills, receipts, inventory |

> Menus are permission-aware — staff only see what their role allows.

---

## 2. Finding your way around

- **Left sidebar** — all modules, grouped (Front Desk, IVF Worklists, Embryology, Billing, etc.). Tap the ☰ menu on tablet/phone to open it.
  - **★ Favourites** — tap the star next to any item to pin it to the top.
  - **Recent** — your last-used screens appear automatically.
  - The **search box** in the sidebar filters the menu; the collapse button (top-left) shrinks the sidebar to icons.
- **Top search bar** — search any patient by **MRN, name or phone** from anywhere.
- **Workspace tabs** — open records (EMRs, cycles, bills) stack as tabs across the top, so you can jump between several patients without losing your place. Close a tab with its ×.

---

## 3. Registering a patient

1. **Register Patient Visit** (or the **Register patient** button on the Patients screen).
2. Enter name, gender, date of birth, phone, etc. Name and gender are required.
3. You can **take a photo** or attach an **ID document** directly (great on iPad).
4. Tap **Register patient**. An **MRN** is generated automatically (e.g. `PF-001023`).
   - If the phone/name+DOB match an existing patient, you'll get a **duplicate warning** — review before continuing.

**Today's Registrations** shows everyone registered today.

---

## 4. The patient record (EMR)

Open a patient (from search or a list) to see tabs:

- **Overview** — identity, contact, recent visits. Allergies show as a red banner.
- **Visits** — the visit timeline. **Register visit** to add one (type, doctor, reason, complaints, diagnosis), then **Sign** it when complete. Signed visits are locked.
- **Forms & History** — fill template-driven clinical forms (Patient History, USG Examination, Gynecology Assessment, etc.). Save as a draft, or **Save & sign** to lock it.
- **IVF Cycles** — create and open the couple's cycles (see §5).
- **Consents** — attach signed consent forms and track their status.
- **Documents** — upload and view scans, reports, prescriptions.
- **Billing** — this patient's bills.

**Creating a couple:** in **IVF Cycles**, link a partner (search an existing patient or register a new one). A **Couple No.** (e.g. `IVF/00012/26`) is generated. Cycles belong to the couple.

---

## 5. Running an IVF cycle

Open a cycle to get its workspace. Change the **cycle status** from the dropdown in the header as treatment progresses. Tabs:

- **Overview** — treatment summary, oocyte/fertilisation figures, the **treatment funnel** (retrieved → mature → 2PN → embryos → transferred → pregnancy) and the latest outcome.
- **Stimulation** — the day-wise monitoring grid plus a **response chart** (follicles, endometrium, E2).
  - **Record next day** opens the entry form: medications (HMG, R-FSH, GnRH Antagonist), follicular scan, endometrium, E2/P4, advice.
  - **Repeat dosage for further days** copies today's doses onto the next N days to save typing.
- **OPU** — consent, date/time, surgeon and embryologists, trigger, and the oocyte/fertilisation counts.
- **Embryology** — record fertilisation (Conventional IVF / ICSI), **add oocytes**, then tap a row to record day-by-day **embryo growth**, grades and attach images. **Wash Semen Sample** records the semen analysis.
- **Storage & PGD** — select embryos to **vitrify** (assign storage unit/position), **thaw**, **renew** vitrifications, or **send/receive PGD** results.
- **Outcome** — **Record Outcome**: transfer date, pregnancy, Beta HCG, clinical pregnancy, location, sacs.
- **Consent & Counselling** — cycle consents and counselling notes.
- **Billing** — create a bill linked to this cycle.

### Worklists (the daily to-do lists)
The **IVF Worklists** and **Embryology** menu groups give you ready-made lists: *Patients for OPU / ET / IUI, Hospital Surgeries for Today, Prepare / Monitor / Vitrify / Thaw Embryos, Renew Vitrifications, Send / Receive PGD, View Vitrified Embryos/Oocytes.* Tap a row to jump straight to the right place in that cycle.

---

## 6. Appointments, consent, documents

- **Schedule Appointments** — pick a day, add appointments (patient, time, doctor, reason), and update status (arrived / completed / no-show).
- **Counsel Infertility Patients** — per-couple counselling notes and consent status.
- **Consent Forms** — the library of forms; upload the signed copy from a patient's or cycle's Consents tab. **Multiple download** grabs several at once.
- **Patient Documents** — attach and view any patient file. Files open through secure, time-limited links.

---

## 7. Billing

1. **New bill** (from Billing, a patient's Billing tab, or **Create Vitrification Bills**).
2. Pick the patient, add line items (description, qty, rate). The total calculates itself.
3. **Create draft bill** → review → **Issue bill**. *Issued bills are locked and can't be edited.*
4. **Collect payment** records a receipt (cash/card/UPI…). A receipt can't exceed the balance; the bill moves to **partial** or **paid** automatically.
- **My Today's Bills** / **My Today's Receipts** show your day's activity. **Print** produces a printable bill.

---

## 8. Inventory

- **Drug Formulary** — add drugs (name, generic, form, strength, unit) and see current **stock on hand**.
- **Record Opening Stock** — enter opening stock, receipts, issues or adjustments. Stock updates automatically.

---

## 9. Reports & Analytics

- **IVF Dashboard & 90 Day Conversion** (home) — live counts, cycles-per-month trend, status donut, IUI performance and IUI→IVF conversions.
- **Reports** — cycles by treatment and status, and total billed, for a date range.
- **Analytics** — charts: cycles per month, billing per month, cycles by status and by treatment.
- **Data Export** — download tables as CSV (every export is audit-logged).

---

## 10. Administration (admin only)

- **Settings → Users** — activate staff and set roles.
- **Settings → Setup** — quick links to IVF Storage, Consent Forms, Document Templates, Drug Formulary and Donors.
- **Settings → Audit log** — a record of who created, changed or deleted key clinical and financial data.
- **Configure Document Templates** — build/edit the clinical forms: add sections and fields (text, number, dropdown, yes/no, dates, computed fields), rename, reorder, duplicate. Templates marked **Partial** still need the clinic to confirm their full field list.
- **IVF Storage** — set up canisters, goblets and hexatubes with colours and positions; see live occupancy.
- **Donors** — register ovum/semen donors and match them to cycles.

---

## Tips

- **Allergies** always show in red on the patient and cycle headers — check before any procedure.
- A record that's **signed** or a bill that's **issued** is locked on purpose; create an addendum or a new record instead of editing.
- Colour never carries meaning alone — status is always labelled in words too.
- On iPad, wide tables (stimulation, embryology) **scroll sideways** while the first column stays put.

---

## Need a change?

Items marked **"proposed"** or **"Partial"** (some dropdown values, the Case Sheet, parts of the semen analysis, and the dashboard success definitions) are placeholders awaiting the clinic's confirmation — tell the team which values are correct and they can be finalised. See `docs/STATUS_AND_OPEN_ITEMS.md` for the full list.
