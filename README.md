# HIN Parser & PostgreSQL Migrator
**Author:** SilvSane

A Node.js console utility designed to parse molecular structure files of fullerenes (`.hin`) and automatically migrate the data into a PostgreSQL database.

## Architecture & Features
- **Idempotency:** Re-running the script completely recreates the tables, preventing data duplication.
- **Ordered Sequential Execution:** Uses modern ECMAScript Modules (ESM) and Top-level `await` to process file operations sequentially, ensuring stable database connection management.
- **Security:** Parametrized SQL queries protect against SQL injections; configuration variables are isolated using Node.js native `.env` support.
- **Robust Parsing:** Supports various `.hin` formats (such as C30 with `**` markers and C70 with `CA` markers) while dynamically skipping extra metadata like velocity blocks (`vel`) or basis sets (`basisset`).

## Quick Start

1. Clone the repository and install the dependencies:
   ```bash
   npm install
   ```

2. Create an empty database in your PostgreSQL instance (e.g., via pgAdmin).

3. Set up your environment configuration:
   - Copy the `.env.example` file and rename it to `.env`.
   - Update it with your actual PostgreSQL credentials (user, host, password, database, port).

4. Open `main.js`, uncomment the examples, and replace them with your actual file paths and desired PostgreSQL table names.

5. Run the migration script:
   ```bash
   npm start
   ```

## Usage Example (`main.js`)

Everything is already configured inside `main.js`. You only need to insert your own paths to the `.hin` files and specify the target table names:

```javascript
import { ParseHin } from "./insert.js";

// //paths examples (INSERT YOUR OWN PATHS HERE)
// const path30 = "n:/Computer Moduling Physics/fullerens/c30.hin";
// const path70 = "n:/Computer Moduling Physics/fullerens/C70.hin";
// const path56 = "n:/Computer Moduling Physics/fullerens/c56.hin";
// const path44 = "n:/Computer Moduling Physics/fullerens/c44.hin";

console.log("File import...");
// //usage examples (SPECIFY YOUR TABLE NAMES HERE)
// await ParseHin(path30, "C30");
// await ParseHin(path70, "C70");
// await ParseHin(path56, "C56");
// await ParseHin(path44, "C44");

console.log("All successed!");
```

## Database Schema

For every processed file, the script automatically creates a table structured with the following columns:
- `id` (SERIAL PRIMARY KEY)
- `atom_number` (INTEGER)
- `energy` (NUMERIC)
- `x`, `y`, `z` (NUMERIC) — Atomic spatial coordinates
- `connection_count` (INTEGER)
- `connections` (INTEGER[]) — Array of linked atom indices
- `connection_types` (TEXT[]) — Array of connection bond symbols
