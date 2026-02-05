# Quick Setup Guide

## PostgreSQL Setup (Required)

### Option 1: Set PostgreSQL Password (Recommended)

1. **Find your PostgreSQL password** during installation OR reset it:
   
   Open Command Prompt as Administrator and run:
   ```cmd
   psql -U postgres
   ```
   
   If it asks for a password and you don't know it, you need to reset it:
   
   ```cmd
   # Find PostgreSQL data directory (usually C:\Program Files\PostgreSQL\15\data)
   # Edit pg_hba.conf and change 'md5' or 'scram-sha-256' to 'trust'
   # Restart PostgreSQL service:
   net stop postgresql-x64-15
   net start postgresql-x64-15
   
   # Now connect without password:
   psql -U postgres
   
   # Reset password:
   ALTER USER postgres PASSWORD 'your_new_password';
   
   # Change pg_hba.conf back to 'scram-sha-256'
   # Restart PostgreSQL again
   ```

2. **Create database:**
   ```cmd
   psql -U postgres
   CREATE DATABASE tgbot;
   \q
   ```

3. **Update `.env` file:**
   ```env
   DATABASE_URL=postgresql://postgres:your_new_password@localhost:5432/tgbot
   ```
   Replace `your_new_password` with your actual PostgreSQL password.

### Option 2: Quick Test (No PostgreSQL)

If you don't have PostgreSQL installed yet, the bot will still run but **won't save user data**.
Just keep the current `.env` and install PostgreSQL later.

## Running the Bot

```bash
npm start
```

The bot should now:
- ✅ Connect to PostgreSQL (if configured)
- ✅ Create the users table automatically
- ✅ Recognize superadmin
- ✅ Start handling messages

## Testing SuperAdmin

1. Send `/start` to your bot
2. You should be recognized as superadmin (based on `SUPERADMIN_ID` in `.env`)
3. You should see "👑 Superadmin panel" button

## Troubleshooting

### "password authentication failed"
- Your PostgreSQL password in `.env` is incorrect
- Update `DATABASE_URL` with the correct password

### "EADDRINUSE: address already in use"
- Another process is using port 3434
- Kill it: `taskkill //F //PID <PID>` (find PID using `netstat -ano | findstr :3434`)
- Or change port in `src/server.js`

### "Cannot recognize superadmin"
- Check `SUPERADMIN_ID` in `.env` matches your Telegram user ID
- Get your ID by messaging @userinfobot on Telegram
