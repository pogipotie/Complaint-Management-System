# 🏛️ Municipal Complaint Registration and Management System (CRMS)

A highly specialized, localized, and secure ticketing system designed for municipalities (specifically configured for Gonzaga, Cagayan). It empowers citizens to report local issues (e.g., potholes, flooding, noise) while providing government admins and staff with a robust dashboard to verify users, track complaint resolutions, and analyze community data.

---

## 🚀 Tech Stack

**Frontend (Client)**
* **Framework:** Angular (v17/18)
* **Styling:** Tailwind CSS (configured with a distinct Neobrutalist/Retro UI design)
* **UI Components:** Angular Material
* **Maps & Geolocation:** Google Maps API (`@angular/google-maps`)
* **Analytics:** Chart.js & `ng2-charts`
* **PDF Export:** `html2canvas` & `jsPDF`

**Backend (BaaS)**
* **Platform:** Supabase
* **Database:** PostgreSQL (with advanced Triggers, Functions, and `pg_cron`)
* **Security:** Row-Level Security (RLS) policies
* **Storage:** Supabase Storage (Private buckets, short-lived Signed URLs)
* **Authentication:** Supabase Auth (Email OTP)

---

## ✨ Key Features

### 👤 Citizen Portal
* **Secure Registration:** 4-step wizard requiring Email OTP confirmation and physical Proof of ID upload.
* **Complaint Submission:** Create detailed reports with exact GPS pinning (Google Maps) and "Before" evidence photos.
* **Community Map:** A secure, public-facing map showing active issues around the municipality (strips PII and sensitive data).
* **Discussion Threads:** Two-way real-time chat with staff regarding specific complaints.
* **Resolution Ratings:** Ability to rate the government's resolution (1-5 stars) and provide feedback.
* **Export:** Export complaint records as official PDF documents.

### 🛡️ Admin & Staff Dashboard
* **User Verification System:** Dedicated queue to review citizen IDs (via secure 10-minute Signed URLs). Admins can Approve, Reject (with mandatory reasoning), or Permanently Ban users.
* **Complaint Management:** Update complaint statuses (`Pending` -> `Assigned` -> `Resolved`). Resolving complaints requires mandatory "After" photo proof and the `resolved` state is terminal (acts as the closed state — no further action is required by the admin).
* **Advanced Filtering:** Multi-criteria data tables allowing instant filtering by Barangay, Category, Priority, and Status.
* **Analytics Dashboard:** Real-time visual data (Doughnut & Bar charts) tracking complaint volume across 25 Barangays and status distribution.
* **Data Export:** Generate and download `.csv` files of complaint data for official government reporting.

### 🔒 Security & Automation
* **Strict RLS:** Citizens can only read/update their own records.
* **Private Storage:** The `citizen_ids` bucket is strictly private, preventing unauthorized public access to sensitive IDs.
* **Automated Cleanup:** A `pg_cron` job automatically deletes rejected unverified user accounts after 24 hours.
* **Audit Logging:** Database triggers automatically log all status changes and updates into an `audit_logs` table.
* **Real-time Notifications:** Automated system notifications when complaints are updated, users are verified/rejected, or citizens submit ratings.

### Captain Profile Pictures
* Captains upload, preview, replace, and remove their own photo in **Captain Profile > Profile Settings**. Photo changes save separately from personal information.
* JPG, PNG, and WebP files are accepted up to 2 MB. Photos appear in the captain account menu, admin captain cards, and official chat.
* The private `captain_photos` bucket uses signed URLs. Officials can view account photos; after the directory migration, anonymous visitors can view only approved directory photos. Storage policies and a database trigger restrict photo changes to the captain who owns the account.
* Apply `supabase/migrations/20261019000000_captain_profile_pictures.sql` before deploying the frontend. It adds `users.profile_picture_path`, creates the bucket, and installs ownership checks. Existing accounts keep their initials until they upload a photo.
* Replacement files use unique paths. A failed profile save removes the new upload; a successful replacement removes the old photo. Storage cleanup failures are logged without undoing a saved profile.

### Captain Profile Review
* Apply `20261019000000_captain_profile_pictures.sql` first, then `supabase/migrations/20261019010000_captain_public_directory.sql`, before deploying the directory frontend. No existing profile is automatically published.
* Captains submit an official title, term dates, office address/hours, official phone/email, and biography in Profile Settings. Explicit consent is required. The database takes name, assigned barangay, and photo from the captain's account.
* Admins open **User Management > Barangay Captains > Profile** to see private account details and compare the submission with the published version. They can approve, reject with a reason, or withdraw publication.
* The public directory page and home-page Captains link have been removed. `/barangay-captains` redirects to Home. Captain editing and admin review remain available; existing database RPCs, publication records, and approved-photo access policies are unchanged by this UI removal.
* New submissions retain the last approved public version until approval or withdrawal. Inactive, unverified, banned, or reassigned captains are omitted from public results.
* Photos referenced by pending or published snapshots are retained by storage deletion policies. Unreferenced older files may need periodic administrator cleanup; the photo bucket remains private.
* Deploy the SQL before the frontend. Verify with an anonymous session that drafts and private details are inaccessible, an unrelated captain cannot review/modify another submission, and only approved photo paths can be signed. The migration must be tested on your Supabase project before production use.

---

## 📂 Project Structure

The entire project is now housed within the `CRMS` directory:

```text
CRMS/
├── src/                    # Angular Frontend Application
│   ├── app/
│   │   ├── core/           # Services (Supabase, Auth, Realtime), Guards, Models
│   │   ├── features/       # Modules: Admin, Citizen, Auth
│   │   └── shared/         # Reusable UI components
├── supabase/               # Backend Configuration & Database
│   ├── migrations/         # Sequential SQL scripts defining tables, RLS, and triggers
│   └── config.toml         # Supabase CLI configuration
├── tailwind.config.js      # Tailwind Neobrutalism theme configuration
└── angular.json            # Angular build configuration
```

---

## 🛠️ Local Development Setup

### 1. Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher)
* [Angular CLI](https://angular.dev/tools/cli) (`npm install -g @angular/cli`)
* [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started) (`npm install -g supabase`)

### 2. Installation
Navigate into the `CRMS` folder and install the frontend dependencies:
```bash
cd CRMS
npm install
```

### 3. Environment Configuration
Create an `environment.ts` and `environment.development.ts` file inside `src/environments/`:
```typescript
export const environment = {
  production: false,
  supabaseUrl: 'YOUR_SUPABASE_URL',
  supabaseKey: 'YOUR_SUPABASE_ANON_KEY',
  googleMapsApiKey: 'YOUR_GOOGLE_MAPS_API_KEY'
};
```

### 4. Database Setup (Supabase)
Ensure your Supabase project is linked, then push the database migrations:
```bash
npx supabase link --project-ref your-project-ref
npx supabase db push
```
*(Note: All Supabase commands must be run from inside the `CRMS` folder because that is where the `supabase` directory is located).*

### 5. Start the Application
Run the Angular development server:
```bash
npm start
```
Navigate to `http://localhost:4200/` to view the application.

---

## 🎨 UI/UX Design System
The application utilizes a **Neobrutalist / Retro SaaS** aesthetic to stand out from generic government portals. 
* **Borders & Shadows:** Heavy use of `border-2 border-gray-900` with hard drop shadows `shadow-[4px_4px_0px_0px_rgba(17,24,39,1)]`.
* **Typography:** Headers utilize heavy fonts (`font-black uppercase`, `font-family: 'Arial Black', Impact, sans-serif`).
* **Interactions:** Buttons translate on hover to create a tactile, "pressable" feel.

---

## 📝 License
This project is proprietary software built for municipal use.
