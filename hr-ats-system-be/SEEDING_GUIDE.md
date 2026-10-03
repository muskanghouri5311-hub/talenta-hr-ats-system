# Database Seeding Guide

## Overview
This guide explains how to use the seeder to initialize your database with roles and create a SuperAdmin account.

## What Gets Seeded

The seeder automatically creates:

### Roles
1. **SuperAdmin** - Full system access, can manage users, roles, and permissions
2. **Admin** - Administrative privileges
3. **HR** - HR department access
4. **Employee** - Employee-level access

### SuperAdmin User
- **Email:** `superadmin@compilex.com`
- **Password:** `SuperAdmin@123`
- **Name:** Super Admin

## Running the Seeder

### First Time Setup
```bash
npm run seed
```

This command will:
- Connect to MongoDB
- Create all roles (if they don't already exist)
- Create a SuperAdmin user (if it doesn't already exist)
- Display the SuperAdmin credentials

### Example Output
```
🌱 Starting Database Seeder...

✓ MongoDB Connected
✓ 1 new role(s) created
✓ SuperAdmin user created successfully

=== SUPERADMIN CREDENTIALS ===
Email: superadmin@compilex.com
Password: SuperAdmin@123
==============================

✓ Database seeding completed successfully!
✓ Database connection closed
```

## SuperAdmin Capabilities

The SuperAdmin user can:

### User Management
- ✅ Create new users
- ✅ View all users
- ✅ Update user information
- ✅ Delete users
- ✅ Assign roles to users

### Role Management
- ✅ Create new roles
- ✅ View all roles
- ✅ Update existing roles
- ✅ Delete roles
- ✅ Manage permissions

### Authentication
- ✅ Full authentication access
- ✅ Change password
- ✅ Reset passwords

## Important Notes

⚠️ **Security:**
- Change the SuperAdmin password immediately after first login
- Don't share SuperAdmin credentials
- Use the SuperAdmin account only for administrative tasks
- Create additional Admin users for daily administrative work

⚠️ **Database:**
- The seeder won't duplicate existing roles or SuperAdmin accounts
- It's safe to run the seeder multiple times
- Existing data won't be affected

## API Endpoints Available for SuperAdmin

### Authentication
```
POST /api/auth/login
POST /api/auth/change-password
```

### User Management
```
GET /api/users
GET /api/users/:userId
PUT /api/users/:userId
DELETE /api/users/:userId
```

### Role Management
```
GET /api/roles
POST /api/roles
PUT /api/roles/:roleId
DELETE /api/roles/:roleId
POST /api/roles/assign
```

## Next Steps

1. Run the seeder: `npm run seed`
2. Login with the SuperAdmin account
3. Change the default password
4. Create additional Admin users for daily operations
5. Assign appropriate roles to users

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check `MONGO_URI` in your `.env` file
- Verify your MongoDB connection string is correct

### "Roles already exist" Error
- This is normal on subsequent runs
- The seeder skips existing roles and only creates new ones
- It's safe to run multiple times

### Email Already Exists Error
- The SuperAdmin user already exists
- If you want to recreate it, delete it from the database first
- Or modify the seeder to use a different email

## Resetting the Seeder

If you need to reset and start fresh:

```bash
# Delete all users and roles from MongoDB
# Then run the seeder again
npm run seed
```

For manual cleanup, you can use MongoDB directly:
```javascript
db.users.deleteMany({})
db.roles.deleteMany({})
```

Then run the seeder again.
