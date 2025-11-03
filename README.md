# OneDrive Clone - Full Stack Application

A high-fidelity, feature-rich clone of Microsoft OneDrive built with Next.js, Node.js, and Supabase. This application provides comprehensive file storage, management, and collaboration capabilities with a UI closely resembling OneDrive.

## 🚀 Features

### Core Features Implemented

1. **Authentication System**
   - User registration and login with Supabase Auth
   - JWT-based authentication
   - Password reset functionality
   - Session management

2. **File Storage & Management**
   - File upload, download, and deletion
   - Folder creation and navigation
   - File preview for images, PDFs, and documents
   - Drag-and-drop file upload
   - Bulk file operations

3. **Cloud Synchronization**
   - Real-time updates using Socket.io
   - Automatic sync status indicators
   - Offline detection and queue management

4. **Version History**
   - Multiple file versions support
   - Version comparison and restoration
   - Version comments and metadata
   - Storage optimization

5. **File Preview**
   - In-app preview for common file types
   - Thumbnail generation for images
   - PDF viewer integration
   - Text file preview

6. **Sharing & Permissions**
   - Share files/folders with other users
   - Public link generation with optional password
   - Permission levels (view, edit, comment)
   - Share expiration dates

7. **Search & Filters**
   - Global file search
   - Filter by file type, date, size
   - Advanced search operators
   - Recent files quick access

8. **Favorites System**
   - Mark files/folders as favorites
   - Quick access sidebar
   - Favorite synchronization

9. **Trash Bin**
   - Soft delete with restoration
   - Automatic cleanup after 30 days
   - Permanent deletion option
   - Bulk restore functionality

10. **Offline Access**
    - Service worker for offline capability
    - Cached file access
    - Sync queue for offline changes

11. **Notifications**
    - Real-time activity notifications
    - Email notifications (optional)
    - In-app notification center
    - Customizable notification preferences

12. **Collaboration Features**
    - Comments on files
    - Threaded discussions
    - @mentions in comments
    - Real-time comment updates

13. **Storage Management**
    - Storage quota display
    - Usage analytics
    - File type breakdown
    - Storage upgrade options

14. **Activity Dashboard**
    - Recent activity feed
    - File access logs
    - Share activity tracking
    - Security audit trail

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **State Management**: React Query (TanStack Query)
- **Real-time**: Socket.io Client
- **File Handling**: react-dropzone
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Authentication**: Supabase Auth
- **Real-time**: Socket.io
- **File Processing**: Sharp (image processing)
- **File Upload**: Multer

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account
- Git

## 🚀 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/onedrive-clone.git
cd onedrive-clone
```

### 2. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)

2. Once your project is created, go to the SQL Editor and run the schema from `backend/supabase/schema.sql`

3. Get your project credentials:
   - Go to Settings > API
   - Copy the Project URL, anon key, and service role key

### 3. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Frontend URL
FRONTEND_URL=http://localhost:3000

# CORS Origins
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# File Upload Configuration
MAX_FILE_SIZE=5368709120
ALLOWED_FILE_TYPES=image/*,application/pdf,text/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/zip,application/x-zip-compressed,video/*,audio/*
```

Start the backend server:

```bash
npm run dev
```

### 4. Frontend Setup

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend
npm install
```

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Start the frontend development server:

```bash
npm run dev
```

### 5. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Health Check: http://localhost:5000/api/health

## 🏗 Project Structure

```
onedrive-clone/
├── frontend/                 # Next.js frontend application
│   ├── app/                  # App router pages
│   ├── components/           # React components
│   ├── lib/                  # Utilities and helpers
│   ├── public/               # Static assets
│   └── styles/               # Global styles
├── backend/                  # Node.js backend application
│   ├── src/
│   │   ├── controllers/      # Route controllers
│   │   ├── middleware/       # Express middleware
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic
│   │   ├── config/           # Configuration files
│   │   └── server.ts         # Server entry point
│   ├── supabase/             # Database schema
│   └── uploads/              # Temporary file storage
└── README.md
```

## 📸 Screenshots

The application features a modern, clean interface that closely resembles Microsoft OneDrive:

- **Dashboard**: File and folder grid/list view with quick actions
- **Command Bar**: Contextual actions based on selection
- **Details Panel**: File information and activity history
- **File Preview**: In-app preview with commenting
- **Sharing Dialog**: Comprehensive sharing options

## 🔒 Security Features

- Row Level Security (RLS) in Supabase
- Secure file upload with type validation
- CORS protection
- Rate limiting on API endpoints
- Secure password storage
- JWT token expiration
- File access logging

## 🚀 Deployment

### Backend Deployment (Heroku/Railway/Render)

1. Set environment variables on your platform
2. Update CORS origins to include your frontend URL
3. Deploy using Git integration

### Frontend Deployment (Vercel)

1. Connect your GitHub repository
2. Set environment variables
3. Deploy with automatic builds

### Supabase

- Your Supabase project is already hosted
- Ensure RLS policies are enabled
- Monitor usage in Supabase dashboard

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Files
- `GET /api/files` - List files/folders
- `POST /api/files/upload` - Upload file
- `GET /api/files/:id` - Get file details
- `DELETE /api/files/:id` - Delete file
- `PATCH /api/files/:id/favorite` - Toggle favorite

### Sharing
- `POST /api/share/:fileId` - Share file
- `GET /api/share/:fileId` - Get shares
- `DELETE /api/share/:fileId/:userId` - Remove share

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Microsoft OneDrive for design inspiration
- Supabase for the excellent backend platform
- The open-source community for amazing tools and libraries

# OneDrive Clone — Full Feature Overview & API Testing Guide

This project implements a OneDrive-like application with a Next.js frontend and an Express + Supabase backend. It includes file storage, sharing, collaboration, version history, sync simulation, offline access, and an admin module.

## Features

- File storage & management
  - Upload, download, rename, delete, restore, permanent delete
  - Folders with hierarchy and drag-and-drop move
  - File metadata (type, size, modified date, owner)
  - Progress and real-time updates via Socket.io
  - Breadcrumb navigation (`/api/files/folders/:id/path`)

- Version history
  - Maintains versions on first upload, new uploads, and restore
  - View version list with time, size, author, comment
  - Restore version (with optional rename)
  - Preview and download specific versions

- Preview & viewer
  - Signed preview URLs for images, PDFs, text
  - Inline modal viewers and conflict previews
  - Thumbnails for images (and an SVG placeholder for PDFs)
  - Mock Office “Web Editor” route for DOCX/XLSX/PPTX

- Sharing & permissions
  - Share to specific users (View/Edit/Comment)
  - Generate public link (with permission)
  - “Shared with me” and “Shared by me” views
  - Access list and revoke; bulk revoke/update permissions

- Search & filters
  - Search by name
  - Filters: type (Images/Documents/Videos/Audio), owner (Me/Shared/By me), sync status
  - Sort by modified/name/size (asc/desc)

- Recent & favorites
  - Recent files page with type filter
  - Favorites page with star/unstar

- Trash / Recycle bin
  - Move deleted items to trash
  - Restore or permanent delete
  - Manual purge endpoint; scheduled purge via env

- Offline (simulated)
  - Mark files available offline
  - Offline manifest and Offline page
  - Report local changes (simulation)

- Sync (simulated)
  - Background sync simulation (syncing → synced)
  - Conflict simulation and resolution (keep my version / keep other / keep both)
  - Sync Center with live counts; tabs, filter, sorting; retry all failed

- Notifications & Activity
  - Socket-based toasts and notification drawer
  - Activity page with grouping and filters; unread dots and mark-all-read

- Admin (optional)
  - List users with storage usage
  - Update storage limit (requires ADMIN_USER_IDS)

## Environment

- Backend requires:
  - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  - `CORS_ORIGINS` (e.g., `http://localhost:3000`)
  - Optional: `ENABLE_AUTO_PURGE=true`, `TRASH_RETENTION_DAYS=30`
  - Optional: `ADMIN_USER_IDS=<comma-separated-user-ids>` for admin endpoints

- Frontend:
  - `NEXT_PUBLIC_API_URL=http://localhost:5000/api`
  - `NEXT_PUBLIC_SOCKET_URL=http://localhost:5000` (optional)

## Running

```
cd onedrive-clone/backend
npm run dev

cd ../frontend
npm run dev
```

## Health Check

`GET /api/health/details` returns a JSON summary with Supabase, storage, DB, and time.

## Postman / HTTP testing — core endpoints

Set a Bearer token from your login (Supabase JWT). Base URL: `http://localhost:5000/api`.

### Files
- `POST /files/upload` — form-data: `file=@/path/file`
- `GET /files` — list (filters: `q|query`, `parent`, `type`, `owner`, `status`, `sort`, `direction`)
- `PATCH /files/:id/rename` — body: `{ name }`
- `POST /files/:id/move` — body: `{ parentId }`
- `PATCH /files/:id/favorite`
- `DELETE /files/:id` → trash; `POST /files/:id/restore`; `DELETE /files/:id/permanent`
- `GET /files/:id/preview` (signed); `GET /files/:id/download` (signed)
- `GET /files/:id/thumbnail?width=200&height=200`

### Version history
- `GET /files/:id/versions`
- `POST /files/:id/versions` — form-data: `file=@/path/file`
- `POST /files/:id/versions/:ver/restore` — body: `{ name? }`
- `GET /files/:id/versions/:ver/preview`
- `GET /files/:id/versions/:ver/download`

### Sharing
- `POST /files/:id/share` — `{ email, permission, message? }`
- `POST /files/:id/share/link` — `{ permission }` → `{ shareId }`
- `GET /public/share/:shareId` — public info; `/preview`, `/download` also available
- `GET /files/:id/shares` — list; `DELETE /files/shares/:shareId`

### Search & recent
- `GET /files/search?q=report&type=document&owner=me&sort=updated&direction=desc`
- `GET /files/recent?type=image`

### Offline (mock)
- `POST /offline/cache/:id` — mark for offline
- `DELETE /offline/cache/:id` — remove offline
- `GET /offline/manifest` — view offline list
- `POST /offline/report` — `{ changes: [{ id }] }`

### Sync (mock)
- `POST /sync/simulate` — `{ ids?: [] }`
- `GET /sync/status` — list non-synced
- `POST /sync/conflict/:id`
- `POST /sync/resolve/:id` — `{ strategy: 'keep_local'|'keep_remote'|'keep_both', name? }`

### Admin (optional)
- (Requires `ADMIN_USER_IDS` to include your user id)
- `GET /admin/users`
- `PATCH /admin/users/:userId/storage` — `{ limit }` (bytes)

## Smoke Test Script

The backend includes a Node smoke test.

```
cd onedrive-clone/backend
API_URL=http://localhost:5000/api TOKEN=your_token FILE_PATH=/path/to/file npm run smoke
```
It will:
- Check health
- List root files
- Optionally upload a file
- Hit version preview/download/restore
- Simulate sync and check status
- Create a public share and verify public endpoint

## Mock Office Web Editor

From file menus (DOCX/XLSX/PPTX), select “Open in Web Editor (mock)”. It opens `/dashboard/editor/:id` with an embedded preview and a fake Save.
