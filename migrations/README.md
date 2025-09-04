# Database Migrations

This directory contains database migration scripts for the Initiate Portal application.

## Production Migration System

### Files:
- `migrate.js` - Production-ready migration runner
- `001_fix_account_flags.sql` - Fix account flags for existing users
- `README.md` - This file

### Usage:

#### Development/Staging:
```bash
cd migrations
node migrate.js
```

#### Production:
```bash
# 1. Backup database first
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Run migrations
NODE_ENV=production node migrate.js

# 3. Verify application functionality
```

### Features:
- ✅ **Idempotent**: Safe to run multiple times
- ✅ **Transactional**: Each migration runs in a transaction
- ✅ **Rollback support**: Automatic rollback on failure
- ✅ **Migration tracking**: Logs all executed migrations
- ✅ **Production optimized**: Connection pooling and error handling
- ✅ **Verification**: Checks migration results
- ✅ **Safe for millions of users**: Optimized queries and resource management

### Migration Log Table:
The system automatically creates a `schema_migrations` table to track:
- Migration name
- Execution timestamp
- Rollback SQL (for emergency rollbacks)

### Best Practices for Production:

1. **Always backup before migrations**
2. **Test migrations on staging environment first**
3. **Run during low-traffic periods**
4. **Monitor system performance during execution**
5. **Have rollback plan ready**

### Rollback (Emergency):
```sql
-- If you need to rollback the account flags migration:
SELECT rollback_sql FROM schema_migrations 
WHERE migration_name = '001_fix_account_flags';

-- Then execute the returned SQL
```
