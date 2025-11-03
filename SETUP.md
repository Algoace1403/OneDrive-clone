# OneDrive Clone Setup Guide

## Prerequisites
- Node.js 18+
- Supabase account
- npm or yarn

## Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file with your Supabase credentials:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_KEY=your_supabase_service_key
   JWT_SECRET=your_jwt_secret
   JWT_REFRESH_SECRET=your_jwt_refresh_secret
   NODE_ENV=development
   PORT=5001
   ```

4. Run database migrations (execute the schema.sql file in Supabase SQL editor)

5. Setup storage bucket:
   ```bash
   npm run setup:storage
   ```

6. Start the backend server:
   ```bash
   npm run dev
   ```

## Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5001/api
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Features Implemented

### User & Authentication
- ✅ Registration with email validation
- ✅ Login with JWT tokens
- ✅ Logout functionality
- ✅ Refresh token mechanism
- ✅ Account management page
- ✅ Storage usage tracking

### File Storage & Management
- ✅ File upload with progress tracking
- ✅ Drag-and-drop file upload
- ✅ Create folders
- ✅ Rename files/folders
- ✅ Delete files (move to recycle bin)
- ✅ Download files
- ✅ Favorite/unfavorite files
- ✅ File metadata display (size, type)
- ✅ Folder hierarchy navigation
- ✅ Breadcrumb navigation
- ✅ Drag-and-drop file movement between folders

### UI/UX
- ✅ Microsoft OneDrive-like dark theme
- ✅ Grid and list view modes
- ✅ Empty state illustrations
- ✅ Responsive design
- ✅ Real-time updates
- ✅ Toast notifications

## Troubleshooting

### Storage Bucket Error
If you see "Bucket not found" error:
```bash
cd backend
npm run setup:storage
```

### Authentication Issues
- Ensure your Supabase project has email auth enabled
- Check that the JWT secrets match in both backend and Supabase

### CORS Issues
- Ensure the backend is running on port 5001
- Check that frontend API URL is correctly set to http://localhost:5001/api

## Development Tips

1. **Testing File Upload**: The upload dialog supports drag-and-drop or click to browse
2. **Folder Navigation**: Click on folders to navigate into them
3. **Multi-select**: Use checkboxes to select multiple files for batch operations
4. **Drag & Drop**: Drag files onto folders to move them

## Next Steps

Consider implementing:
- Real-time collaboration features
- File sharing with permissions
- Version history
- Search functionality
- File preview (images, documents)
- Mobile responsive improvements