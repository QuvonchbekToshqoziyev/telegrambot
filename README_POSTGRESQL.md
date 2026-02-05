# PostgreSQL Migration Guide

The bot has been successfully migrated from MongoDB to PostgreSQL.

## Setup Instructions

### 1. Install PostgreSQL
- Download and install PostgreSQL from https://www.postgresql.org/download/
- During installation, remember your postgres user password

### 2. Create Database
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE tgbot;

# Exit psql
\q
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment
Update your `.env` file with the PostgreSQL connection string:
```
DATABASE_URL=postgresql://username:password@localhost:5432/tgbot
```

Replace:
- `username` with your PostgreSQL username (default: `postgres`)
- `password` with your PostgreSQL password
- `localhost` with your database host (if remote)
- `5432` with your PostgreSQL port (if different)
- `tgbot` with your database name (if different)

### 5. Run the Bot
```bash
npm start
```

The bot will automatically create the `users` table on first run.

## Database Schema

The `users` table has the following structure:

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(20) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    region VARCHAR(100) DEFAULT 'Noma''lum',
    is_admin BOOLEAN DEFAULT FALSE,
    is_super_admin BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    channel_joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Production Deployment

For production (e.g., Heroku, Railway, etc.), the `DATABASE_URL` environment variable should be set automatically. The code includes SSL support for production databases.

## Troubleshooting

### Connection Issues
- Verify PostgreSQL is running: `pg_isready`
- Check your connection string format
- Ensure the database exists
- Verify credentials are correct

### Migration from MongoDB
If you need to migrate existing data from MongoDB to PostgreSQL:
1. Export data from MongoDB
2. Transform the data to match the new schema
3. Import into PostgreSQL

Let me know if you need help with data migration!
