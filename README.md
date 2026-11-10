# PAS — Progressive Association Society (প্রগ্রেসিভ অ্যাসোসিয়েশন সোসাইটি)

Official Share & Installment Ledger Statement, Fund Accounting & Member Portfolio Management Portal.

## 🌟 Key Features

- **Master Financial Ledger**: 32 allotted share units across 21 active members with automated compound late fee calculations (5% after grace period).
- **Two-Way Google Sheets Sync**: Real-time live synchronization with Google Sheets, automatic table formatting, Grand Total summary row, and auto-sync triggers.
- **Cloud Real-time & Offline Persistence**: Cloud Firestore background synchronization and localStorage offline fallback.
- **Member Directory & KYC Profiles**: Chronological PAS share ID ordering, contact directory, NID, address records, and quick portfolio lookup.
- **Print & PDF Export**: A4 landscape print styling with printable letterhead, signature blocks, and ink-friendly dark mode reset.
- **Structured CSV / Excel Export**: UTF-8 BOM (`\uFEFF`) encoded tabular export with clean single-row headers.
- **Bilingual Interface**: Seamless 1-click toggling between Bengali (বাংলা) and English.
- **Deed & Legal Vault**: Digital viewer for society trust deeds, land registries, annexure records, and bylaws.
- **Role-Based Admin Access**: Secure Admin authentication with session lock for write operations and public view mode for general members.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- npm / pnpm / yarn

### Installation

```bash
git clone https://github.com/kimJonggy/PAS.git
cd PAS
npm install
npm run dev
```

### Build for Production

```bash
npm run build
```

---

**Developed with ❤️ by [Adnan Taher](https://www.facebook.com/adu77)**
