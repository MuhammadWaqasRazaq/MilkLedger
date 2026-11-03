# Milk Ledger

A local-first milk business ledger for a household dairy operation. It tracks daily
milk supplied by two fixed buyers, monthly settlements, payables, receivables,
yearly reports, backup/restore, and deleted records.

The app runs as a React single-page application with an Express + MongoDB API. It is
designed to be run on one computer on your local network and does not require
authentication or cloud services.

## Features

- **Dashboard** with current-month totals, buyer cards, payment progress, yearly
  totals, charts, monthly comparison, and recent activity.
- **Milk records** for morning and evening buyers, one entry per buyer per day, with
  support for decimal kilograms and zero-kg records.
- **Bulk month entry** to fill morning and evening kilograms for many dates at once,
  with existing values pre-filled and blank rows skipped.
- **Date-based milk rates** in Rs. per kg. Changing a rate recalculates affected
  milk records automatically.
- **Milk payments** tied to a settlement month/year and buyer, with installment
  tracking and overpayment protection.
- **Payables and receivables** with person history, free-text reasons, installments,
  and person-name search.
- **Backup and export** as a full JSON backup, CSV, or Excel-compatible files.
- **Trash** for soft-deleted records, with restore and permanent deletion.
- **Responsive UI** with a desktop sidebar, Android-friendly bottom tab bar,
  mobile drawer for secondary pages, bottom-sheet forms, safe-area support, and
  touch targets sized for phones.
- **Light/dark themes** with a system-aware default, persisted preference, and
  theme-aware charts.

## Tech stack

| Layer    | Technology                                              |
| -------- | ------------------------------------------------------- |
| Frontend | React 18, Vite 5, Tailwind CSS 3, Lucide, Recharts       |
| Backend  | Node.js, Express 4, Mongoose 8                           |
| Database | MongoDB 8 (local)                                        |
| Language | JavaScript (ES modules)                                  |

## Project structure

```text
milkCal/
├─ client/                     React + Vite frontend
│  ├─ src/
│  │  ├─ api/                  Fetch wrapper and download helpers
│  │  ├─ components/           Layout, dashboard, milk, obligation, and UI components
│  │  ├─ context/              Theme and toast providers
│  │  ├─ hooks/                Data-fetching hook
│  │  ├─ pages/                Route pages
│  │  └─ utils/                Formatting, dates, class-name helpers
│  └─ dist/                    Production build served by Express
├─ server/                     Express + Mongoose API
│  ├─ src/
│  │  ├─ config/               Database connection and shared constants
│  │  ├─ controllers/          HTTP request handlers
│  │  ├─ middleware/           Async wrapper and error handling
│  │  ├─ models/               Mongoose schemas
│  │  ├─ routes/               API route definitions
│  │  ├─ services/             Business logic and calculations
│  │  ├─ utils/                Dates, numbers, errors, export helpers
│  │  ├─ app.js                Express app and static SPA serving
│  │  ├─ index.js              Server entry point
│  │  └─ seed.js               Sample data and clear script
│  └─ .env.example             Environment template
├─ package.json                npm workspaces and root scripts
└─ README.md
```

## Prerequisites

- Node.js 18 or newer
- npm 9 or newer
- MongoDB 8 running locally, or a reachable MongoDB connection string

By default the API connects to:

```text
mongodb://127.0.0.1:27017/milk_ledger
```

## Setup

1. Install dependencies from the project root:

   ```bash
   npm install
   ```

2. Create the server environment file:

   ```bash
   copy server\.env.example server\.env
   ```

   On macOS/Linux use `cp server/.env.example server/.env`.

3. Start MongoDB if it is not already running.

4. Start both the API and the Vite dev server:

   ```bash
   npm run dev
   ```

   - Frontend: <http://localhost:5173>
   - API: <http://localhost:5000>

   Vite proxies `/api` requests to the API server during development.

5. Optionally load sample data:

   ```bash
   npm run seed
   ```

## Environment variables

`server/.env`:

| Variable        | Default                                  | Purpose                              |
| --------------- | ---------------------------------------- | ------------------------------------ |
| `PORT`          | `5000`                                   | API and production server port       |
| `MONGODB_URI`   | `mongodb://127.0.0.1:27017/milk_ledger`  | MongoDB connection string            |
| `CLIENT_ORIGIN` | `http://localhost:5173`                  | Allowed development client origin    |

## Scripts

Run these from the project root:

| Command             | Description                                            |
| ------------------- | ------------------------------------------------------ |
| `npm run dev`       | Start API and Vite dev server together                 |
| `npm run server`    | Start only the API in watch mode                       |
| `npm run client`    | Start only the Vite dev server                         |
| `npm run build`     | Build the frontend into `client/dist`                  |
| `npm start`         | Start the production server and serve `client/dist`    |
| `npm run seed`      | Load sample data if the database has no milk records   |
| `npm run seed:clear`| Delete all app data and restore default rates          |

For production:

```bash
npm run build
npm start
```

Then open <http://localhost:5000>. Express serves the built React app and all API
routes from the same origin.

## Business rules

### Buyers

There are exactly two buyers:

- **Morning**
- **Evening**

They are fixed and cannot be added, renamed, or deleted.

### Milk quantity and amount

- `1 Mann = 40 kg` for quantity reference only.
- Amount per record = `quantityKg * applicableRate`
- Money is rounded to two decimal places, preserving paisa.
- Decimal kilograms and zero-kg records are allowed.

### Milk rates

- Rates are configured separately for morning and evening.
- Every rate has an `effectiveFrom` date.
- A milk record uses the rate for its buyer whose `effectiveFrom` is the latest date
  less than or equal to the record date.
- Default rates are morning `180` and evening `190` per kg, effective from
  `2020-01-01`.
- Creating, updating, deleting, or restoring a rate recalculates affected buyer
  records by date.
- Rates stored by older versions in Rs. per Mann are converted automatically on
  startup and when restoring old backups.

### Milk payments

- A payment belongs to one buyer and one settlement month/year.
- Multiple installments are allowed.
- A payment cannot exceed the remaining amount for that buyer and settlement month.
- Deleting a payment moves it to trash; it no longer counts toward the settlement.

### Payables and receivables

- Each entry has a person name, reason, original amount, date, optional notes, and
  installments.
- Payments cannot exceed the outstanding amount.
- Person history shows all entries and payments for a person.
- Search matches person names.

### Deletion and trash

- Application records use soft deletion (`isDeleted`, `deletedAt`).
- Deleted records appear in **Trash** and can be restored.
- Restoring a milk record or rate checks for an active conflict first.
- Restoring an installment checks that its parent exists and the amount still fits.
- Permanently deleting a payable or receivable also permanently deletes its
  installments.
- Full backups include soft-deleted records.

## API overview

All routes are under `/api`.

| Method | Route                                      | Description                         |
| ------ | ------------------------------------------ | ----------------------------------- |
| GET    | `/health`                                  | Health check                        |
| GET    | `/dashboard?month&year`                    | Dashboard data                      |
| GET    | `/milk/records?month&year`                 | Monthly milk records                |
| POST   | `/milk/records`                            | Create or replace a day's records   |
| POST   | `/milk/records/bulk`                       | Create or replace many days at once |
| PUT    | `/milk/records/:date`                      | Update a day's records              |
| DELETE | `/milk/records/:date`                      | Soft-delete a day's records         |
| GET    | `/milk/rates`                              | Current rates and rate history      |
| POST   | `/milk/rates`                              | Add or revive a rate                |
| PUT    | `/milk/rates/:id`                          | Update a rate                       |
| DELETE | `/milk/rates/:id`                          | Soft-delete a rate                  |
| GET    | `/milk/payments?month&year`                | Monthly settlement and payments     |
| POST   | `/milk/payments`                           | Record a milk payment               |
| DELETE | `/milk/payments/:id`                       | Soft-delete a milk payment          |
| GET    | `/payables`                                | List payables                       |
| GET    | `/payables/person/:name`                   | Payable history for a person        |
| POST   | `/payables`                                | Create a payable                    |
| PUT    | `/payables/:id`                            | Update a payable                    |
| DELETE | `/payables/:id`                            | Soft-delete a payable               |
| POST   | `/payables/:id/payments`                   | Add a payable installment           |
| DELETE | `/payables/:id/payments/:paymentId`        | Soft-delete an installment          |
| GET    | `/receivables`                             | List receivables                    |
| GET    | `/receivables/person/:name`                | Receivable history for a person     |
| POST   | `/receivables`                             | Create a receivable                 |
| PUT    | `/receivables/:id`                         | Update a receivable                 |
| DELETE | `/receivables/:id`                         | Soft-delete a receivable            |
| POST   | `/receivables/:id/payments`                | Add a receivable installment        |
| DELETE | `/receivables/:id/payments/:paymentId`     | Soft-delete an installment          |
| GET    | `/reports/milk?year`                       | Yearly milk breakdown               |
| GET    | `/reports/monthly?month&year`              | Monthly records and payments        |
| GET    | `/backup`                                  | Download a full JSON backup         |
| POST   | `/backup/restore`                          | Replace data from a JSON backup     |
| GET    | `/backup/datasets`                         | List export datasets and formats    |
| GET    | `/backup/export/:dataset?format&month&year`| Export a dataset as CSV or XLS      |
| GET    | `/trash`                                   | List deleted records                |
| POST   | `/trash/:type/:id/restore`                 | Restore a deleted record            |
| DELETE | `/trash/:type/:id`                         | Permanently delete a deleted record |

## Backup and restore

Download a full JSON backup from **Backup & Export**. It contains all collections,
including deleted records, and a metadata header with export time and counts.

To restore:

1. Open **Backup & Export**.
2. Select a previously downloaded JSON backup.
3. Confirm the restore.

Restore replaces the current data in all app collections with the backup contents.
Take a fresh backup before restoring if you might need the current data.

Dataset exports are available for milk records, milk payments, milk rates, payables,
receivables, and installment payments. Export formats are CSV and Excel-compatible
`.xls` files.

## Sample data

`npm run seed` adds:

- Daily milk records for the current month up to today, plus the two previous months.
- A partial current-month milk payment and full payment for the previous month.
- Sample payables for Ahmed and Bilal.
- Sample receivables for Ali and Usman.

The seed command is intentionally guarded: if milk records already exist, it does
nothing. To delete all app data and load a clean sample set:

```bash
npm run seed:clear
npm run seed
```

`seed:clear` removes all milk, rate, payment, payable, and receivable data and
restores the default rates.

## Notes

- This app is intended for trusted local or home-network use. It has no login or
  user accounts.
- Keep regular JSON backups if the data is important.
- The production server serves `client/dist`; rebuild after frontend changes.
