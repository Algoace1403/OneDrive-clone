# OneDrive Clone Setup Guide

## Current Status ✅

- **Frontend**: Running on http://localhost:3001 (with new Microsoft OneDrive landing page design)
- **Backend**: Running on http://localhost:5001
- **Database**: Supabase (PostgreSQL) configured and running
- **Authentication**: Working with Supabase Auth

## Demo Accounts

You can login with these pre-created accounts:

| Email | Password | Name |
|-------|----------|------|
| demo@outlook.com | DemoPass123! | Demo User |
| john.doe@outlook.com | JohnPass123! | John Doe |
| jane.smith@outlook.com | JanePass123! | Jane Smith |

## Important Notes about Authentication

1. **Email Validation**: Supabase blocks certain test email domains (like @example.com, @test.com). Use realistic email addresses like @outlook.com, @gmail.com, etc.

2. **Email Confirmation**: By default, Supabase requires email confirmation. The demo accounts above are pre-confirmed. For new registrations in development:
   - Go to your Supabase Dashboard
   - Navigate to Authentication > Providers > Email
   - Disable "Confirm email" for development

## Test the API

```bash
# Test login (use the provided script to handle special characters in password)
./test-login.sh

# Or test health endpoint
curl http://localhost:5001/api/health

# Test file operations (requires authentication token)
TOKEN="your_jwt_token_from_login"
curl -H "Authorization: Bearer $TOKEN" http://localhost:5001/api/files
```

## Implemented Features

All 14 requested features are implemented:
1. ✅ User Authentication (Supabase Auth)
2. ✅ File Storage & Management (Supabase Storage)
3. ✅ Cloud Synchronization (Real-time with Socket.io)
4. ✅ Version History
5. ✅ File Preview (Multiple formats)
6. ✅ Sharing & Permissions
7. ✅ Search & Filters
8. ✅ Favorites
9. ✅ Trash Bin
10. ✅ Offline Access (Service Worker)
11. ✅ Notifications
12. ✅ Collaboration & Commenting
13. ✅ Storage Management
14. ✅ OneDrive UI Design

## Known Issues & Solutions

### Issue: "Email address is invalid"
**Solution**: Use realistic email addresses (@outlook.com, @gmail.com) instead of test domains

### Issue: JSON parsing error with special characters
**Solution**: Use the provided test-login.sh script or escape special characters properly

### Issue: Port already in use
**Solution**: The app automatically switches to alternative ports (Frontend: 3001, Backend: 5001)

## Next Steps

1. Access the frontend at http://localhost:3001
2. Click "Sign in" or "Create a free account"
3. Use one of the demo accounts or create a new account with a realistic email
4. Start uploading and managing files!

## Environment Variables

Both `.env` files are configured:
- Backend: `/backend/.env` (Port 5001, Supabase credentials)
- Frontend: `/frontend/.env.local` (API URL pointing to port 5001)

## Database

The PostgreSQL schema has been applied to Supabase with tables for:
- users
- files
- versions
- shares
- activities
- comments
- notifications
- favorites

All with proper Row Level Security (RLS) policies.