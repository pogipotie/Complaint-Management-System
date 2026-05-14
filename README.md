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
* **Complaint Management:** Update complaint statuses (`Pending` -> `Assigned` -> `In Progress` -> `Resolved` -> `Closed`). Resolving complaints requires mandatory "After" photo proof.
* **Advanced Filtering:** Multi-criteria data tables allowing instant filtering by Barangay, Category, Priority, and Status.
* **Analytics Dashboard:** Real-time visual data (Doughnut & Bar charts) tracking complaint volume across 25 Barangays and status distribution.
* **Data Export:** Generate and download `.csv` files of complaint data for official government reporting.

### 🔒 Security & Automation
* **Strict RLS:** Citizens can only read/update their own records.
* **Private Storage:** The `citizen_ids` bucket is strictly private, preventing unauthorized public access to sensitive IDs.
* **Automated Cleanup:** A `pg_cron` job automatically deletes rejected unverified user accounts after 24 hours.
* **Audit Logging:** Database triggers automatically log all status changes and updates into an `audit_logs` table.
* **Real-time Notifications:** Automated system notifications when complaints are updated, users are verified/rejected, or citizens submit ratings.

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
