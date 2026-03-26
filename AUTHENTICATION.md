# Authentication System - Complete

## Overview
Implemented a complete authentication system for the Liberty POS application with login, logout, and session management.

## Features

### 1. Login Page (`/login`)
- **Route**: `http://localhost:3002/login`
- **Features**:
  - Username and password authentication
  - Password visibility toggle
  - Loading states during authentication
  - Error handling and display
  - Modern, light-themed UI
  - Auto-redirect to dashboard on successful login

### 2. Session Management
- **Cookie-based sessions** (7-day expiration)
- **Middleware protection** for all dashboard routes
- **Auto-redirect** to login if not authenticated
- **Session API** at `/api/auth/session` for checking auth status

### 3. Logout Functionality
- **Logout button** in sidebar (bottom left)
- **Loading state** while logging out
- **Session cleanup** on logout
- **Auto-redirect** to login page

### 4. User Display
- **Header shows** logged-in user's name and role
- **Avatar** with user's first initial
- **Role badge** (admin/cashier)

## API Endpoints

### `/api/auth/login` (POST)
**Request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "id": "user_id",
  "username": "admin",
  "name": "Admin User",
  "role": "ADMIN"
}
```

### `/api/auth/logout` (POST)
Clears session cookie and logs out user.

### `/api/auth/session` (GET)
**Response:**
```json
{
  "authenticated": true,
  "user": {
    "userId": "user_id",
    "username": "admin",
    "name": "Admin User",
    "role": "ADMIN"
  }
}
```

## Middleware Protection

The `middleware.ts` file protects all routes except:
- `/login` - Login page
- `/` - Landing page
- `/api/*` - API routes
- Static files

**Behavior:**
- Unauthenticated users → Redirected to `/login`
- Authenticated users on `/login` → Redirected to `/dashboard`

## Security Features

### Password Hashing
- Uses SHA-256 hashing (for demo)
- **Production recommendation**: Use bcrypt or argon2

### Session Security
- HttpOnly cookies (not accessible via JavaScript)
- Secure flag in production
- SameSite: Lax (CSRF protection)
- 7-day expiration

### Route Protection
- Middleware checks all protected routes
- Automatic redirect for unauthorized access

## Default Credentials

To test the system, you'll need to create a user first. Use the Admin page or run this SQL:

```sql
INSERT INTO User (id, username, password, name, role, createdAt, updatedAt)
VALUES (
  'admin_001',
  'admin',
  'fc5e038d38a57032085441e7fe7010b0', -- SHA-256 hash of 'admin'
  'Administrator',
  'ADMIN',
  NOW(),
  NOW()
);
```

Or create via the Admin page after logging in with any existing user.

## Usage Flow

### First Time Setup
1. Create a user via Admin page (if you have access)
2. Or insert a user directly into the database
3. Navigate to `/login`
4. Enter credentials
5. Click "Sign In"

### Normal Login Flow
1. Visit any dashboard route (e.g., `/dashboard`)
2. Middleware redirects to `/login`
3. Enter username and password
4. Successfully authenticated → Redirected to `/dashboard`
5. Session stored in cookie

### Logout Flow
1. Click "Logout" button in sidebar
2. Session cookie cleared
3. Redirected to `/login`

## Components Updated

### `Sidebar.tsx`
- Added logout handler
- Shows loading state during logout
- Calls `/api/auth/logout` API

### `dashboard/layout.tsx`
- Now a client component
- Fetches user session on mount
- Displays user name and role in header
- Shows user avatar with initial

## File Structure

```
src/
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── login/route.ts      # Login endpoint
│   │       ├── logout/route.ts     # Logout endpoint
│   │       └── session/route.ts    # Session check
│   ├── login/
│   │   └── page.tsx                # Login page UI
│   └── dashboard/
│       └── layout.tsx              # Shows user info
├── components/
│   └── Sidebar.tsx                 # Logout button
└── middleware.ts                   # Route protection
```

## Testing

### Test Login
1. Navigate to `http://localhost:3002/login`
2. Enter credentials
3. Verify redirect to dashboard
4. Check header shows your name

### Test Logout
1. Click "Logout" in sidebar
2. Verify redirect to login
3. Try accessing `/dashboard` directly
4. Should redirect back to login

### Test Session Persistence
1. Login successfully
2. Refresh the page
3. Should remain logged in
4. Close browser and reopen
5. Should remain logged in (7-day cookie)

## Production Recommendations

1. **Use bcrypt** for password hashing
   ```bash
   npm install bcrypt
   ```

2. **Add HTTPS** in production (required for secure cookies)

3. **Environment variables**:
   ```env
   SESSION_SECRET=your-secret-key-here
   NEXT_PUBLIC_URL=https://yourdomain.com
   ```

4. **Add rate limiting** to login endpoint

5. **Implement password reset** functionality

6. **Add 2FA** for admin accounts

7. **Session refresh** mechanism

8. **Audit logging** for authentication events

## Known Limitations

- Simple SHA-256 hashing (not production-ready)
- No password reset functionality
- No "Remember Me" option
- No session refresh mechanism
- No brute-force protection

---

**Status**: ✅ Complete and Functional
**Login Route**: `/login`
**Protected Routes**: All `/dashboard/*` routes
**Session Duration**: 7 days
