# MASTER BUILD PROMPT --- ARCHANA IVF

## Production-Grade IVF Hospital Information Management System (HMIS)

### 1. Your Role and Mission

Act as a complete senior product engineering team consisting of:

-   Principal Software Architect
-   Senior Full-Stack Engineers
-   Senior UI/UX Designer specializing in Apple-quality interfaces
-   IVF Clinical Workflow Analyst
-   Database Architect
-   Application Security Engineer
-   QA and Automation Engineer
-   DevOps and Infrastructure Engineer

Your mission is to design, engineer, test and deliver a complete,
production-grade IVF Hospital Information Management System for Archana
IVF, using the two supplied Medics IVF / Medics Prime
reverse-engineering documents as the primary reference for reproducing
the source application's documented workflows.

This is not a landing-page project, dashboard-only project, or visual
prototype.

Build a complete, usable clinical and operational system with a premium
user interface, comprehensive IVF workflows, responsive iPad and tablet
support, reliable data persistence, strict access controls, and
auditable operations.

The system must be sufficiently complete for real clinic workflows after
clinical validation, security verification, deployment and user
acceptance testing.

### 2. Non-Negotiable Priorities

Prioritize these requirements in this order:

1.  **Complete functional coverage:** Preserve every documented module,
    field, label, action, workflow, status and visible interaction from
    both source documents.
2.  **Exceptional UI/UX:** Every screen must feel deliberately designed,
    cohesive, polished and easy for clinical staff to use.
3.  **Responsive iPad and tablet experience:** The entire application
    must work in portrait and landscape orientations, across tablet
    sizes and desktop environments.
4.  **Clinical correctness and data integrity:** Patient, couple, IVF
    cycle, laboratory, embryology, consent and outcome records must
    maintain correct relationships and histories.
5.  **Security and auditability:** Protect sensitive patient information
    with appropriate access control, encryption, auditing and
    operational safeguards.
6.  **Performance and reliability:** Optimize everyday clinical
    workflows, database access, data entry and navigation.
7.  **Complete operational functionality:** Registration, scheduling,
    billing, receipts, inventory, documents, reporting, analytics and
    all other documented operational worklists must not be omitted.

Do not sacrifice functional completeness for visual simplicity. Instead,
use information architecture, progressive disclosure, sensible grouping
and adaptive layouts to make complex workflows easy to understand.

### 3. Source Documents Are the Requirements Authority

Read both supplied Word documents completely before implementing the
system:

-   `Medics_IVF_Part_1_Detailed_Documentation(2).docx`
-   `Medics_IVF_Part_Detailed_Reverse_Engineering(4).docx`

These documents are essential project inputs. Read every page, table,
section, checklist, field inventory, screen inventory, implementation
note and verification warning. Inspect embedded page images when text
extraction is incomplete.

Do not rely solely on summaries or the merged document's introductory
pages.

#### Mandatory extraction procedure

Before building:

1.  Extract all headings, modules, screens, fields, labels, dropdown
    options, status values, buttons, modal actions, table columns and
    navigation entries from both documents.
2.  Create a requirements register with a unique identifier for every
    requirement.
3.  Record its source document, page or section, original terminology,
    workflow context, expected behavior and verification status.
4.  Identify overlapping descriptions and combine them only when they
    refer to the same behavior.
5.  Preserve the original wording of clinically significant labels and
    field names.
6.  Maintain a list of uncertain, unreadable, partially observed or
    inferred requirements.
7.  Create a traceability matrix linking every requirement to its
    implementation location and automated or manual test.
8.  Maintain this matrix throughout development.

**Never silently discard a requirement.**

If a source field is unreadable, record it as unresolved rather than
inventing a value. If the source documents disagree, preserve both
observations and flag the conflict for review.

Distinguish carefully between:

-   Observed source behavior
-   Partially observed behavior
-   Proposed implementation decisions
-   Requirements needing confirmation from Archana IVF
-   Features that cannot be established from recordings alone

The objective is to reproduce the documented Medics workflows while
engineering a more usable, maintainable and secure system.

### 4. Product Design Philosophy --- Apple-Quality UX

Use Apple's Human Interface Guidelines as a design reference,
particularly layout, hierarchy, consistency, accessibility, touch
interactions and iPad adaptation.

Official references:

-   https://developer.apple.com/design/human-interface-guidelines/
-   https://developer.apple.com/design/human-interface-guidelines/layout
-   https://developer.apple.com/design/human-interface-guidelines/accessibility
-   https://developer.apple.com/design/human-interface-guidelines/designing-for-ipados

Apply the principles intelligently to a clinical web application. Do not
imitate consumer-app aesthetics at the expense of medical information
density, safety or efficiency.

#### Visual direction

Create a premium, calm, modern healthcare interface.

Use:

-   A predominantly light interface with carefully controlled neutral
    backgrounds.
-   A restrained clinical color palette with one primary brand color.
-   Excellent typography, consistent line heights and readable data
    labels.
-   Clear page titles, section headings and meaningful visual hierarchy.
-   Consistent spacing, radii, borders, dividers and component
    dimensions.
-   Subtle shadows only where they clarify layering.
-   Restrained animations and immediate interaction feedback.
-   Clear visual distinctions between routine information, warnings,
    errors and critical alerts.
-   High-quality empty states, loading states, success feedback and
    error recovery.
-   Consistent icons with text labels for important clinical actions.

Avoid excessive gradients, glassmorphism, oversized dashboard cards,
unnecessary decoration, tiny text, dense unstructured forms and generic
AI-generated dashboard aesthetics.

#### Build a reusable design system

Establish design tokens for:

-   Typography
-   Color
-   Spacing
-   Borders and radii
-   Elevation
-   Responsive breakpoints
-   Focus states
-   Interactive states
-   Status indicators
-   Form controls
-   Table density
-   Modal dimensions
-   Animation and transition timing

Build reusable components for buttons, inputs, date pickers, selectors,
searchable dropdowns, tabs, navigation, tables, clinical cards, alerts,
dialogs, document viewers, file uploads, audit histories and form
sections.

All modules must share the same design language.

#### Clinical usability rules

-   Show patient identity and relevant patient/cycle context
    consistently.
-   Make the current workflow step and record status obvious.
-   Keep primary actions predictable and easy to reach.
-   Use inline validation with clear explanations.
-   Preserve unsaved form data when safe to do so.
-   Confirm destructive actions.
-   Prevent accidental duplicate submissions.
-   Never communicate clinical severity using color alone.
-   Do not use color alone to communicate consent, treatment or
    laboratory status.
-   Ensure important actions are discoverable without relying on hover.
-   Keep long clinical forms navigable through section anchors, logical
    grouping and progress indicators where appropriate.
-   Make complex tables readable without forcing users to zoom out
    excessively.

### 5. Responsive Design --- Tablets Are a First-Class Platform

The application must be designed for real clinical use on iPads and
other tablets, not merely scaled down from a desktop interface.

Support:

-   iPad mini and smaller tablets
-   10--11-inch tablets
-   12--13-inch tablets
-   Tablet portrait mode
-   Tablet landscape mode
-   Desktop and laptop displays
-   Resizable browser windows
-   Touch interaction and external keyboard usage

#### Adaptive navigation

On large screens, use a persistent sidebar with clear grouping and an
optional contextual panel.

On tablets, use an adaptive sidebar or collapsible navigation with the
ability to switch between navigation and content without losing context.

On narrow screens, move to a compact navigation pattern while retaining
access to every module.

Do not shrink a desktop sidebar until it becomes unusable. Do not force
the user to navigate through excessive nested menus.

#### Responsive tables

IVF, billing, laboratory and worklist tables often contain many columns.

For every table:

-   Identify its most important columns.
-   Keep critical identifiers and statuses accessible.
-   Use horizontal scrolling only when it is genuinely appropriate.
-   Keep row actions discoverable.
-   Provide a suitable tablet layout using column prioritization, detail
    panels or structured row cards.
-   Preserve access to every field and action.
-   Avoid hiding critical clinical information without a clear way to
    reveal it.
-   Ensure keyboard navigation and screen-reader semantics remain
    functional.

Embryology grids and stimulation monitoring tables require particularly
careful treatment. They must remain usable for real data entry on
tablets.

#### Responsive forms and dialogs

-   Use one-column forms on narrow layouts.
-   Use two-column or multi-column forms only when the viewport and
    field relationships support them.
-   Use full-height or near-full-height editing panels on tablets where
    this improves usability.
-   Keep primary save and cancel actions visible when appropriate.
-   Avoid dialogs that extend beyond the viewport.
-   Support the on-screen keyboard without obscuring the active input or
    submit action.
-   Ensure date pickers, dropdowns, autocomplete controls and upload
    interfaces work with touch.

#### Accessibility and touch

Use comfortable touch targets, aiming for at least 44 × 44 CSS pixels
for primary interactive controls, consistent with Apple's platform
guidance when translated to a web interface.

Support keyboard navigation, visible focus, semantic headings,
accessible labels, sufficient contrast, scalable text and reduced-motion
preferences.

Test real viewport sizes rather than assuming that responsive CSS is
correct.

### 6. Application Shell and Navigation

Reproduce the documented Medics application structure, adapting it to
Archana IVF branding.

Implement:

-   Clinic and location context
-   Authenticated user and role information
-   Persistent primary navigation
-   Worklists
-   My Favourites
-   Recently Used
-   Open EMR
-   Patient Visits
-   Inventory
-   Reports
-   Analytics
-   Data Export
-   Setup
-   Settings
-   Workspace tabs or an equivalent efficient multi-record navigation
    system
-   Breadcrumbs and contextual navigation where useful
-   Search and quick access to frequently used workflows

Preserve the documented source labels in the requirements register and
map them to the final interface.

Support relevant worklists and navigation entries, including:

-   Register Patient Visit
-   Today's Registrations
-   Schedule Appointments
-   Open EMR
-   IVF Dashboard & 90 Day Conversion
-   Counsel Infertility Patients
-   Match Semen Donors
-   Match Ovum Donors
-   View Ovum Donors
-   Patients for OPU
-   Patients for ET
-   Patients for IUI
-   Prepare Embryos
-   Monitor Embryos
-   Vitrify Embryos
-   Thaw Embryos
-   Renew Embryo Vitrifications
-   Send Embryo Samples for PGD
-   Receive PGD Results
-   Fertilise Donor Oocyte and Sperm
-   View Donor Fertilisations
-   View Embryo Vitrifications
-   View Vitrified Embryos
-   View Vitrified Oocytes
-   IVF Storage
-   Hospital Surgeries for Today
-   Create Vitrification Bills
-   My Today's Bills
-   My Today's Receipts
-   Attach Patient Documents
-   Patient Documents
-   Document Templates
-   Configure Document Templates
-   Drug Formulary
-   Record Opening Stock

Also extract and implement any additional documented entries found in
either source.

Navigation must be permission-aware. Users must not see or access
unauthorized clinical or administrative functionality.

### 7. Complete Functional Module Requirements

Implement every module documented in both source files. The following is
the minimum module map, not a replacement for the complete requirements
register.

#### A. Patient registration and patient search

Implement patient registration, patient selection, MRN-based lookup,
identity details, contact information, date of birth, gender, location
context and patient visit registration.

Support:

-   Search by MRN, name and phone number.
-   Search across locations where authorized.
-   Patient selection and duplicate detection.
-   Patient and partner relationships.
-   Visit history and relevant clinical context.
-   Patient document attachment and retrieval.
-   Clear validation and duplicate prevention.

Where Archana IVF's approved workflow requires identity documents,
camera capture or photograph upload, implement secure capture, storage
and access controls. Confirm mandatory documents and rules with the
clinic before enforcing them.

#### B. Patient EMR and visit timeline

Implement:

-   Patient and couple records.
-   EMR detail views.
-   Patient visit history.
-   Visit type, date, doctor, reason for visit, chief complaints and
    diagnosis.
-   Specialist consultation records.
-   Clinical notes and structured forms.
-   Signed and signed-by indicators.
-   Historical record access.
-   Record outcome workflows.
-   Appropriate save, cancel and confirmation behavior.

Maintain the relationship between patient, partner, visit, clinical note
and treatment cycle.

#### C. General, obstetric and medical history

Preserve the fields documented in Part 1, including:

**Obstetric summary:** Gravida, Para, Living, Abortion and Ectopic.

**Obstetric history:** Year of Pregnancy, Type of Conception, outcome,
Gestational Age at Delivery, Gestational Status at Delivery, Birth
Outcome, Mode of Delivery, Date of Delivery, Obstetric Pathology and
Number of babies delivered.

Include documented options such as Missed miscarriage, Ectopic
pregnancy, Induced abortion, Molar Pregnancy, Delivery, Live Birth,
Still Birth, Vaginal Delivery and LSCS.

**Patient past history:** Diabetes, Hypertension, Hypothyroidism,
Hyperthyroidism, Tuberculosis, Cardiac Disease, Asthma, Cancers,
Epilepsy, Genetic disease and Others, with Yes/No controls.

**Surgical history:** No significant surgical history, Surgery Name,
Procedure done at, Date and Procedure name, including the documented
uterine, fallopian tube, ovarian and chromopertubation options.

**Treatment and personal history:** No significant treatment history,
diet preferences, profession, marital status, date of marriage,
consanguinity, trying since and type of infertility.

Preserve the original dropdown values and wording in the source
register.

#### D. USG examination and configurable clinical templates

Implement the USG Examination template, including:

-   Scan Type: TAS and TVS
-   LMP
-   Cycle Day
-   Comments
-   Uterine Position
-   Uterine Size (L × AP × TR)
-   Endometrium Thickness
-   Endometrium Normal/Abnormal
-   Fibroid, Location, Type, Measurement and Comment
-   Adenomyosis
-   Adenomyoma
-   Uterine Malformations

Support the documented template actions:

-   Edit Field
-   Rename Field
-   Remove Field
-   Insert Field Before
-   Insert Field After
-   Insert Text Before
-   Insert Text After
-   Insert Duplicate
-   Edit Paragraph
-   Edit Section
-   Add Field / New Field
-   Single value --- Text
-   Single value --- Numeric
-   Numeric Details
-   Computed fields

Implement configurable document templates and template library metadata,
including document name, category, speciality, diagnosis and gender.

Do not hard-code every clinical template separately when a configurable
form engine can faithfully represent the required behavior.

Computed expressions must be validated before production. Do not copy an
uncertain formula blindly.

#### E. IVF couple and cycle management

Implement the complete couple and cycle context, including:

-   Couple number
-   Female and male partner records
-   Partner MRNs
-   Age, gender and contact details
-   Referred By
-   Allergies
-   Cycle number and identifier
-   Start date
-   Treatment type
-   Ovum source/type
-   Sperm source/type
-   Protocol name
-   Daily dose
-   Cycle status
-   Treatment protocol and cycle outcome

Support documented treatment and gamete-origin combinations, including
IVF (ICSI), self ovum (fresh) and partner sperm.

Model IVF cycles as distinct longitudinal records linked to the couple
and patient. Historical cycles must remain available.

#### F. IVF stimulation monitoring

Implement the day-wise stimulation monitoring table with the documented
fields:

-   HMG (mg)
-   R-FSH (mg)
-   GnRH Antagonist (mg)
-   Timing
-   Right Follicles (mm)
-   Left Follicles (mm)
-   Endo Thickness (mm)
-   Endo Doppler
-   E2
-   P4

Implement daily stimulation result entry, including medication name,
generic drug name, dosage, quantity, remarks, follicular scan,
endometrium, labs, advice, timing and repeat dosage for further days.

Preserve historical daily entries and dosage changes. Validate numerical
values and units. Make the interface usable on a tablet without
compromising measurement readability.

#### G. OPU and outcome management

Implement OPU-related fields and actions:

-   Consent For OPU
-   Date/Time of OPU
-   Surgeon
-   Assistant Surgeon
-   Primary Embryologist
-   Secondary Embryologist
-   Trigger On
-   Trigger At

Implement the documented cycle outcome workflow, including Transfer
Date, Gestation, Pregnancy, Beta HCG, Beta HCG Value, Recording Date,
Clinical Pregnancy, Clinical Pregnancy Recorded Dates, Location and
No. of sac seen, together with all other confirmed source fields.

Use validated date/time controls, explicit save feedback and appropriate
history tracking.

#### H. Consent and infertility counselling

Implement the consent library, document attachments, filters, multiple
download, upload consent and associated actions.

Preserve every consent-form entry found in the source documents,
including the explicitly listed FORM 13 HINDI, FORM 12 HINDI, FORM 9
HINDI, FORM 8 HINDI, FORM 7 HINDI, FORM 6 HINDI, FORM 9, FORM 11, FORM
12, FORM 4, FORM 6 and UPLOAD CONSENT FORM (SSB).

Reconcile duplicates only after verifying whether the names represent
distinct forms or language variants.

Implement counselling records with:

-   Patient/couple identifier
-   Done By
-   Date
-   Note
-   Recorded By
-   New Note
-   Refused to continue
-   Consent pending
-   Consent received
-   Consent denied
-   Received on
-   ADD CONSENT FORM

Preserve consent history and the identity of the user making each
change.

#### I. Male partner and semen analysis

Implement semen collection, semen analysis, macroscopic analysis,
microscopic analysis, morphology, processed sample and processed sample
morphology.

Implement the documented Wash Semen Sample workflow, including:

-   Volume (ml)
-   Concentration (mill/ml)
-   Total Sperm
-   Rapid Progressive (%)
-   Slow Progressive (%)
-   Non-Progressive (%)
-   immobile (%)
-   Total motile prog.
-   Morphology PR
-   Normal in %
-   Abnormal in %
-   Head Defects in %
-   Mid-piece Defects in %
-   Manual Calculation
-   MACS Done
-   HBAL
-   DFI
-   PICS! --- preserve the original spelling pending verification
-   Occasional Count

Do not invent units, calculations or laboratory reference ranges that
have not been clinically confirmed.

#### J. Embryology, fertilisation and embryo growth

Implement Monitor Embryos and all documented embryo-related views.

Preserve:

-   Couple No.
-   Female and male partner details
-   IVF/cycle identifier
-   Embryo day groupings
-   Date of fertilisation
-   Treatment
-   Ovum
-   Sperm
-   Date/Time of Insemination / ICSI
-   Fertilisation Method
-   Oocyte No.
-   Stage
-   Survival
-   Semen Sample ID
-   Comments
-   Embryo Growth
-   Embryo Growth Image
-   Embryologist 1
-   Embryologist 2
-   Incubator/equipment reference
-   Fertilisation Successful

Include the additional documented ICSI fields:

-   Semen No.
-   Oocytes No.
-   Embryo Source
-   SPZ Morphology
-   SPZ Location
-   Comments
-   Attach Embryo Growth Image

Support Conventional IVF and ICSI, the documented oocyte-level fields
such as Sample, Polar Body, Breakage, Attempts, SPZ Morpho, SPZ
Location, Comments and Growth, and the relevant day-wise monitoring
states.

Preserve embryo-to-oocyte, semen-sample, fertilisation-event and
IVF-cycle relationships.

#### K. Embryo preparation, storage and vitrification

Implement the documented worklists and workflows for:

-   Prepare Embryos
-   Vitrify Embryos
-   Thaw Embryos
-   Renew Embryo Vitrifications
-   Embryo Vitrifications
-   IVF Storage
-   View Vitrified Embryos
-   View Vitrified Oocytes
-   View Embryo Vitrifications
-   View Donor Fertilisations
-   Fertilise Donor Oocyte and Sperm
-   Send Embryo Samples for PGD
-   Receive PGD Results

Extract all remaining fields, columns, statuses and actions from both
documents before considering these modules complete.

Do not invent clinical storage procedures or embryology rules. Validate
them with qualified clinic personnel.

#### L. Dashboard, reporting and analytics

Implement IVF Dashboard & 90 Day Conversion and all documented
dashboard/report views.

Include the source-observed areas:

-   Failed IUI Conversions
-   IUI Treatment Performance
-   IUI Cycles Succeeded / Failed IUI → IVF Conversions
-   Summary By / Procedure
-   Relevant KPI cards and tables

Treat demo values as examples only. Do not populate production
dashboards with invented clinical metrics.

Provide meaningful filtering, clear date ranges, appropriate empty
states and permission-controlled data access.

#### M. Billing, receipts, sales and operational worklists

Treat all documented financial and operational workflows as required
functionality.

Implement the documented worklists and actions for:

-   My Today's Bills
-   My Today's Receipts
-   Create Vitrification Bills
-   Schedule Appointments
-   Hospital Surgeries for Today
-   Patients for OPU
-   Patients for ET
-   Patients for IUI
-   Today's Registrations
-   Record Opening Stock
-   Drug Formulary
-   Data Export
-   Inventory
-   Other billing, sales, financial or receipt functionality discovered
    in either source document

Before implementing any additional sales workflow, inspect the source
material to determine its actual requirements. Do not invent a sales
module merely because the term appears in this prompt.

Billing and receipt records must have reliable persistence, traceable
changes, appropriate permissions and accurate financial calculations.
Never fabricate payment status or silently modify issued financial
records.

#### N. Documents and attachments

Implement patient documents, clinical document viewing, PDF/report
viewing, consent attachments, template management and embryo growth
image attachments.

Include secure upload, validation, preview, retrieval, download
permissions and audit logging.

Do not expose sensitive document URLs publicly. Use authorized file
access and appropriate storage controls.

#### O. Administration, roles and settings

Implement the documented setup and settings functionality, including
document template configuration and other source-observed administrative
features.

Build role-based access controls for appropriate clinical,
administrative, laboratory, front-desk and finance users.

Confirm the clinic's exact role matrix before enabling sensitive
actions.

### 8. Data Architecture and Database Integrity

Design a normalized, maintainable relational database.

At minimum, evaluate entities for:

-   Patients
-   Patient identifiers and contacts
-   Couples and partner relationships
-   Visits and appointments
-   EMR notes and clinical records
-   Medical, obstetric, surgical and treatment histories
-   Clinical templates, sections, fields and versions
-   IVF cycles and treatment protocols
-   Stimulation days and medication records
-   Follicular scans and laboratory measurements
-   OPU procedures and outcomes
-   Semen samples and processing records
-   Oocytes and fertilisation events
-   Embryos and embryo-growth observations
-   Embryo storage, vitrification and thaw events
-   Consent records and attachments
-   Counselling notes
-   Patient documents
-   Bills, receipts and payments
-   Inventory and drug formulary
-   Users, roles and permissions
-   Audit events
-   Notifications and operational worklists

This is a proposed starting model, not an assertion that every entity
already exists in the source application.

Use foreign keys, appropriate indexes, constraints, transactions and
unique identifiers. Avoid unnecessary duplication of patient and cycle
information.

Use immutable audit events for sensitive actions. Use record versioning
or concurrency controls to prevent staff from accidentally overwriting
one another's work.

Store timestamps consistently and display them in the clinic's
configured timezone. Store dates of birth and clinical dates with
semantics appropriate to date-only values.

Maintain a traceable history of relevant clinical and financial changes.

### 9. Security and Production Readiness

Treat patient information as highly sensitive.

Implement:

-   Secure authentication and session management
-   Server-side authorization for every protected operation
-   Least-privilege access controls
-   Strong password and session policies appropriate to deployment
-   Multi-factor authentication where required by the clinic's security
    policy
-   TLS in transit
-   Encryption at rest and protected key management
-   Secure file storage
-   Input validation and output encoding
-   Protection against SQL injection, cross-site scripting, CSRF where
    applicable and insecure direct object references
-   Rate limiting and abuse protection
-   Secrets management
-   Security event logging
-   Audit trails for clinical, consent, document and financial actions
-   Session expiration and secure logout
-   Controlled data export
-   Tested backup and recovery procedures
-   Dependency scanning and vulnerability management

Never place credentials, privileged database keys or secret
configuration values in client-side code.

Use synthetic data in development and testing. Do not copy identifiable
demo-patient information into production fixtures.

#### Deployment environment

The intended Archana IVF deployment may be on-premises. Design for
secure on-premises deployment and confirm the final hosting model with
the clinic.

Where required, support network restrictions and IP allowlisting at the
appropriate infrastructure layer. Do not rely on IP restrictions as a
replacement for authentication or authorization.

Provide documented environment configuration, migrations, deployment
instructions, backup procedures, recovery testing and operational
monitoring.

Do not make the system dependent on an external cloud service unless the
dependency has been explicitly approved.

### 10. Technology and Engineering Approach

First inspect the existing repository, installed dependencies,
infrastructure and deployment environment. Preserve working project
conventions where sensible.

If starting from scratch, use a coherent, maintainable architecture. A
suitable candidate is:

**Frontend** - Next.js and TypeScript - React - A consistent accessible
component system - Tailwind CSS or an equivalent token-driven styling
approach - Validated forms and typed API contracts - Responsive,
reusable clinical components

**Backend** - FastAPI with Python, or an existing equivalent
production-ready backend - Clear service boundaries - Server-side
validation and authorization - Versioned API contracts - Background jobs
only where necessary

**Database** - PostgreSQL - Version-controlled database migrations -
Referential integrity and indexing - Transactional writes - Appropriate
connection pooling

**File storage** - Secure private object storage or an approved
on-premises file-storage solution

**Testing and operations** - Unit and integration tests - Browser-based
end-to-end tests - Automated type checking, linting and builds - CI/CD
and deployment checks - Structured logging and error monitoring

Do not add technologies merely to make the architecture appear
sophisticated.

Do not introduce Supabase, Firebase or another hosted dependency without
confirming that it satisfies the clinic's deployment, privacy and
networking requirements.

### 11. Performance and Data-Entry Experience

Optimize the application around actual clinical tasks.

-   Avoid unnecessary full-page reloads.
-   Prevent redundant database connections and repeated queries.
-   Use appropriate indexes and pagination.
-   Avoid fetching entire patient histories when only a small subset is
    required.
-   Cache only data for which caching is safe.
-   Invalidate cached data when clinical records change.
-   Keep search responsive and protect against excessive requests.
-   Use loading indicators that communicate real progress.
-   Avoid blocking the entire screen during unrelated operations.
-   Handle network interruptions without silently losing entered data.
-   Prevent duplicate submissions and race conditions.
-   Provide clear success and failure feedback.

Measure real performance before declaring the system fast. Establish
performance budgets and test representative patient search, EMR,
dashboard, stimulation and embryology workflows under realistic
conditions.

### 12. Testing and Acceptance Criteria

A feature is not complete because its page renders.

Every module must have:

-   A working user interface
-   Functional controls and actions
-   Persisted data where applicable
-   Server-side validation
-   Appropriate authorization
-   Loading, empty, error and success states
-   Responsive layouts
-   Automated tests
-   Requirements traceability

#### Required test categories

**Functional testing** - Every documented field and button - Save, edit,
cancel and confirmation flows - Search, filters, sorting and
pagination - File uploads and downloads - Clinical and financial
relationships - Template configuration - Status transitions and
validation

**Responsive testing** - iPad mini - 10--11-inch tablets - 12--13-inch
tablets - Portrait and landscape - Desktop and laptop - Resized browser
windows - Touch interaction and keyboard input

**Security testing** - Unauthorized access - Cross-patient data access -
Role violations - Session handling - File access - Audit integrity -
Input validation - Sensitive data exposure

**Data integrity testing** - Concurrent edits - Duplicate submissions -
Failed transactions - Migration safety - Backup restoration - Clinical
and financial history preservation

**Visual QA** - Typography and spacing consistency - Table overflow -
Modal sizing - Date picker positioning - On-screen keyboard behavior -
Empty states - Error messages - Touch target sizes - Contrast and
accessibility

Never claim that tests passed unless they were actually executed.

### 13. Required Project Deliverables

Produce and maintain:

1.  A complete requirements register derived from both source documents.
2.  A source-to-implementation traceability matrix.
3.  A unified product requirements document.
4.  A screen inventory and navigation map.
5.  A complete design system and reusable component library.
6.  Responsive implementations of every documented module.
7.  A documented database schema and versioned migrations.
8.  API documentation.
9.  Role and permission specifications.
10. An audit and security design.
11. Automated unit, integration and end-to-end tests.
12. A deployment and environment configuration guide.
13. Backup and recovery documentation.
14. A production-readiness checklist.
15. A register of unresolved source ambiguities and clinic decisions.
16. A module-by-module completion report showing implemented, tested,
    partially implemented and blocked requirements.

All documentation must reflect the actual implementation rather than an
aspirational plan.

### 14. Execution Plan

Work in the following phases.

**Phase 1 --- Repository and source audit**

Inspect the existing codebase and both Word documents. Extract every
requirement and produce the traceability matrix. Do not start by
building only a dashboard.

**Phase 2 --- Architecture and design system**

Define the navigation, information architecture, responsive breakpoints,
typography, colors, component patterns, database relationships and API
boundaries.

**Phase 3 --- Application foundation**

Implement authentication, authorization, the application shell,
responsive navigation, shared components, database migrations and audit
infrastructure.

**Phase 4 --- Core patient and clinical workflows**

Implement patient registration, search, EMR, visit timelines, clinical
histories, configurable templates, USG and IVF cycle management.

**Phase 5 --- IVF treatment and laboratory workflows**

Implement stimulation monitoring, OPU, outcomes, semen analysis,
fertilisation, embryology, embryo growth, storage and vitrification.

**Phase 6 --- Consent and operational workflows**

Implement consent, counselling, documents, billing, receipts, inventory,
worklists, reporting, analytics and all remaining source-observed
modules.

**Phase 7 --- Responsive and visual refinement**

Test all relevant viewports, eliminate overflow and unusable controls,
refine interactions and ensure the complete application---not just its
main screens---meets the design standard.

**Phase 8 --- Verification and deployment**

Execute automated tests, security checks, database integrity checks,
responsive QA and deployment validation. Resolve critical failures
before release.

At every phase, update the requirements register and report remaining
gaps.

### 15. Strict Implementation Rules

-   Do not stop after creating a plan or generating a UI mockup.
-   Do not implement only the dashboard and a few sample pages.
-   Do not replace complex IVF workflows with generic forms.
-   Do not omit less frequently used screens, laboratory fields,
    operational worklists, billing or receipt functionality.
-   Do not invent clinical fields, medical calculations, consent rules
    or treatment decisions.
-   Do not hard-code demo-patient data into the product.
-   Do not use placeholder buttons for required actions.
-   Do not report unimplemented modules as completed.
-   Do not hide missing functionality behind attractive UI.
-   Do not sacrifice tablet usability to fit every field into a
    desktop-style table.
-   Do not remove source fields just because they make the interface
    more complex.
-   Do not deploy with known critical security defects.
-   Do not overwrite production data during migrations or tests.
-   Do not assume that visually similar source screens have identical
    business logic.
-   Do not claim production readiness without actual verification.

When source evidence is incomplete, create an explicit implementation
decision and verification task rather than guessing.

When a module is too large to complete in one iteration, implement it in
coherent, tested increments while preserving the full requirement
inventory.

### 16. Definition of Done

The system is ready for clinic acceptance only when:

-   Every requirement extracted from both source documents is accounted
    for.
-   Every documented module, field, action and relevant workflow is
    implemented or explicitly marked as blocked by an unresolved
    requirement.
-   Every critical action has real behavior and appropriate persistence.
-   Patient, couple, IVF cycle, laboratory, embryo, consent and
    financial records maintain correct relationships.
-   All major workflows work on iPads and tablets in both orientations.
-   The UI is cohesive, accessible, fast and suitable for prolonged
    clinical use.
-   Permissions and audit trails are verified.
-   Automated tests pass, and unresolved failures are documented.
-   Deployment, backups and recovery procedures are validated.
-   Archana IVF representatives have reviewed and approved the clinical
    workflows.
-   The release status accurately distinguishes development completion
    from production approval.

### Final Directive

Start by inspecting the repository and reading both attached documents
in their entirety.

Then build the actual system, not just a specification for building it.

Maintain complete traceability to the source material. Give exceptional
priority to responsive UI/UX, but never sacrifice clinical completeness,
data integrity or security.

**The goal is a comprehensive, production-grade Archana IVF HMIS that
combines the full documented functionality of Medics IVF with a
significantly better tablet-first user experience.**
