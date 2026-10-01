# HIN Parser & PostgreSQL Migrator

Author: SilvSane

A Node.js console utility that parses molecular structure files of fullerenes (.hin) and migrates the data into a PostgreSQL database. The utility walks you through file selection and table naming with an interactive prompt, and can create the target database automatically if it does not exist.

## Requirements

- Node.js 20.6 or newer. The utility relies on the native `--env-file` flag and top-level await.
- PostgreSQL 14 or newer, either installed locally or running in Docker.

For the Docker path you also need Docker Desktop or Docker Engine with the Compose plugin.

## Features

- Idempotency: re-running with the same table name drops the old table and recreates it, so no data is duplicated.
- Sequential execution: uses ES modules and top-level await to keep file and database operations strictly in order.
- Parameterized SQL: all inserts go through placeholders, so user data cannot break the query.
- Configurable through .env: credentials, connection info, and the folder with .hin files are read from a single environment file.
- Automatic database setup: if the database named in .env does not exist on the connected server, the utility connects to the default `postgres` database with the same credentials and issues `CREATE DATABASE`.
- Readable connection errors: on failure the utility prints the driver error code, a short hint, the contents of .env.example, and the SQL needed to fix the problem manually.
- Interactive prompts: asks for the path to the .hin file and the target table name, validates both, and re-asks on error without exiting.
- Tolerant parsing: handles various .hin variants (C30 with `**` markers, C70 with `CA`, others with custom markers such as `CR`). The parser locates atom data by the first numeric token after the marker, so it is not tied to any specific marker string.

## Project Layout

```
.
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
├── README-ru.md
└── src
    ├── main.js
    ├── cli
    │   ├── prompts.js
    │   └── validators.js
    ├── config
    │   └── dbConfig.js
    ├── db
    │   ├── ensure.js
    │   └── insert.js
    └── parsers
        └── parseHin.js
```

## Configuration

Copy `.env.example` to `.env` and fill in your values. Do not use quotation marks around values.

```
DB_USER=postgres
DB_HOST=localhost
DB_DATABASE=postgres
DB_PASSWORD=your_password
DB_PORT=5432
HIN_DIR=N:/Computer Moduling Physics/fullerens
```

Notes on the .env file:

- Values must not be wrapped in quotes. Docker Compose treats the quotes as part of the value, so `DB_PASSWORD="secret"` becomes the password `"secret"` with literal quote characters.
- The only exception is values that contain spaces or special characters. If you really need quoting, use single quotes. Single quotes suppress variable expansion in Compose, double quotes do not.
- `HIN_DIR` is only used in Docker mode. It points to a folder on the host that will be mounted into the container. Local mode ignores it.
- `DB_HOST=localhost` works for local mode. In Docker, `DB_HOST` is overridden to `db` automatically by docker-compose.yml.
- `.env` is listed in .gitignore. Never commit it.

## Local Run

Use this path if you have PostgreSQL installed on the same machine or available over the network, and you want to run the utility directly with Node.

1. Install dependencies.

   ```
   npm install
   ```

2. Make sure PostgreSQL is running and reachable with the credentials from .env. If you do not have a database matching `DB_DATABASE` yet, either create it manually through psql or pgAdmin, or just let the utility create it on the first run.

3. Start the utility.

   ```
   npm start
   ```

The utility checks the database connection first. If the database does not exist but the server is reachable, it creates the database and continues. If the server is unreachable or credentials are wrong, it prints the error and exits.

After the connection check, the utility asks for a path to a .hin file. You can paste a Windows or Unix path, with forward or back slashes, wrapped in quotes or not. The utility normalizes the input, verifies that the file exists, and checks the .hin extension. When the file is accepted, the utility prints its size and asks for the target table name.

## Docker Run

Use this path if you want an isolated environment with a managed PostgreSQL instance and no local installation required.

1. Make sure `HIN_DIR` in .env points to the folder on the host that contains your .hin files. The folder must exist before the first run; otherwise Docker creates an empty directory owned by root.

2. Build the application image.

   ```
   docker compose build
   ```

3. Start the database container in the background.

   ```
   docker compose up -d db
   ```

4. Wait until the database reports healthy.

   ```
   docker compose ps
   ```

   Look for `Up (healthy)` in the STATUS column. It usually takes a few seconds after the first start.

5. Run the utility in interactive mode.

   ```
   docker compose run --rm app
   ```

   This starts a temporary container with a live terminal attached, so the interactive prompts work as expected. The `--rm` flag removes the container once the utility exits, which is the intended behavior for a one-shot tool.

6. When asked for the path to the .hin file, use the container-side path. Everything from `HIN_DIR` on the host is available as `/hin` inside the container. For example, if the file is `N:/Computer Moduling Physics/fullerens/c38.hin` on the host, type `/hin/c38.hin`.

   To confirm what is visible inside the container, run:

   ```
   docker compose run --rm app ls /hin
   ```

7. To stop the database and remove the containers while keeping the data:

   ```
   docker compose down
   ```

   To remove the data volume as well and start fresh:

   ```
   docker compose down -v
   ```

## Interactive Prompts

The utility opens with a short banner and a note about pressing Ctrl+C to abort at any time.

First prompt: path to the .hin file. Input is normalized, then validated. The check rejects empty input, missing files, directories, and files with a non-.hin extension. Errors are printed inline and the prompt is repeated.

Second prompt: PostgreSQL table name. Validation rules:

- Must be a non-empty string.
- Length must not exceed 63 characters.
- Allowed characters: Latin letters, digits, and underscore. The first character cannot be a digit.
- Must not be one of the reserved SQL keywords, such as `select`, `insert`, `drop`, `user`, `table`.

If the table name passes validation but the insert fails at the database level, the utility prints the error and asks for a new table name without exiting. Press Ctrl+C to abort.

## Behavior on Connection Errors

Before asking anything, the utility calls `ensureDatabase`. The logic is:

1. Try to connect to the target database using the credentials from .env. If the connection succeeds, continue.
2. If the driver returns `3D000` (database does not exist), connect to the default `postgres` database with the same credentials, check `pg_database` for the target name, and issue `CREATE DATABASE` if it is not found. Then reconnect to the target and continue.
3. If any other error occurs, print a diagnostic block and exit with code 1.

The diagnostic block contains the error code, a short human-readable hint, the contents of .env.example, and the SQL to run manually if the automatic creation is not possible.

Common error codes:

- `ECONNREFUSED`: the server is not running, or the host or port is wrong.
- `ENOTFOUND`: the host name cannot be resolved.
- `ETIMEDOUT`: the connection timed out.
- `28P01`: invalid password for the user.
- `28000`: invalid authorization specification.
- `3D000`: the database does not exist.
- `42501`: insufficient privilege to create the database.

If the connection is refused or times out, the utility exits. If the database is missing but the credentials work, the utility creates it automatically.

## Database Schema

For every processed file, the utility creates a table with the following columns:

- `id` (SERIAL PRIMARY KEY)
- `atom_number` (INTEGER)
- `energy` (NUMERIC)
- `x`, `y`, `z` (NUMERIC), atomic spatial coordinates
- `connection_count` (INTEGER)
- `connections` (INTEGER[]), array of linked atom indices
- `connection_types` (TEXT[]), array of bond symbols

Re-running with an existing table name drops the old table first, so the table always reflects the most recent import.

## Supported .hin Formats

The parser reads the `mol` block, skips `vel` and other metadata lines, and processes only lines that start with `atom`. For each atom line, it walks through the tokens and starts reading numeric data at the first token that looks like a number. This makes the parser independent of the marker token, which may be `**`, `CA`, `CR`, or anything else depending on the source.

If the parser encounters a non-numeric token where a number is expected, it throws an error that includes the line number and the raw line, so the problem is visible without digging through the database logs.

## Troubleshooting

`docker compose` reports `services.volumes must be a mapping`. This is a YAML indentation problem. Every level uses exactly two spaces. The top-level `volumes:` block must be at column zero, outside of any service.

`docker compose run app` does not accept keyboard input. Both `stdin_open: true` and `tty: true` must be present in the app service. Without them, the interactive prompt cannot render.

PostgreSQL reports `invalid password for user` (code 28P01) on the first Docker run. The password stored in the database volume does not match the one in .env. Environment variables like `POSTGRES_PASSWORD` only take effect when the volume is initialized for the first time. To reinitialize, run `docker compose down -v` and start again.

The utility reports `not found: /app/N:\...\file.hin`. The path was entered as a Windows path, but the utility runs inside a Linux container. Use the container-side path instead, for example `/hin/file.hin`.

PostgreSQL reports `invalid input syntax for type integer: "NaN"`. The parser failed to locate a numeric field in an atom line. The current parser mitigates this by scanning for the first numeric token and by validating each parsed value, so the error message will point at the specific line.

The application fails to connect to the database from inside Docker. Make sure `DB_HOST` is set to `db` in the app service of docker-compose.yml. Inside the container, `localhost` refers to the container itself, not to the host or to the database service.

Port 5432 is already in use. A local PostgreSQL instance may be running. Either stop it, or change the port mapping in docker-compose.yml to something like `"5433:5432"`, and keep the internal `DB_PORT: 5432` unchanged.

The interactive prompt shows an old file listing or a stale tree. This was an issue with an earlier version of the utility. The current version uses a plain text input for the path and does not render a file tree.

## Development

The project uses ES modules. `package.json` declares `"type": "module"`, so all .js files use `import` and `export`.

The `src` layout groups code by responsibility:

- `src/cli` contains the interactive layer.
- `src/config` contains environment-derived settings.
- `src/db` contains database access, connection checking, and schema creation.
- `src/parsers` contains the .hin reader.

The entry point is `src/main.js`. It checks the connection, then loops on the interactive prompts until a valid table name and successful insert are both achieved.

## License

ISC