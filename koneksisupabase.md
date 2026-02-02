# Konfigurasi Koneksi Supabase

Berikut adalah konfigurasi koneksi Supabase yang digunakan sebelumnya:

## File .env
```
# Connect to Supabase via connection pooling
DATABASE_URL="postgresql://postgres.oazyjsnhxamlamvotyll:dzikrullah99@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection to the database. Used for migrations
DIRECT_URL="postgresql://postgres.oazyjsnhxamlamvotyll:dzikrullah99@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="Ql5v5qFILcOuJ36jAXZz5fe5ejHVvT/H86OCpq+TzG8="

# Redis Configuration (optional, for caching)
# REDIS_URL="redis://localhost:6379"

# For production deployment
# NEXTAUTH_URL="https://yourdomain.com"

# --- Other configurations (uncomment and set as needed) ---
# SMTP Configuration for email notifications
# SMTP_HOST="smtp.gmail.com"
# SMTP_PORT=587
# SMTP_USER="your_email@gmail.com"
# SMTP_PASSWORD="your_app_password"

# API Keys for external services (uncomment and set as needed)
# GOOGLE_API_KEY="your_google_api_key"
# STRIPE_SECRET_KEY="your_stripe_secret_key"
```

## File .env copy
```
# Database Configuration - Direct connection to Supabase (for production)
DATABASE_URL="postgresql://postgres:dzikrullah99@db.oazyjsnhxamlamvotyll.supabase.co:5432/postgres?sslmode=require"

# Authentication
NEXTAUTH_URL="https://toko-sakinah-nextjs.vercel.app/"
NEXTAUTH_SECRET="Ql5v5qFILcOuJ36jAXZz5fe5ejHVvT/H86OCpq+TzG8="
```

Konfigurasi ini telah disimpan sebagai referensi sebelum migrasi ke koneksi Prisma Postgres yang baru.