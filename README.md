# OneDrive Clone

## Screenshots

![Dashboard](frontend/public/image/img3.png)

## Status

Frontend present; backend API not included in this repository. Set `NEXT_PUBLIC_API_URL` to a running backend.

## Features

- Authentication and token refresh
- File upload, download, move, rename, delete
- Folders with breadcrumb navigation
- Grid and list views with skeleton loaders
- Favorites and recent files
- Sharing (links, shared with me, shared by me)
- Comments with reactions
- Version history and details panel
- Activity feed with filters
- Offline manifest view
- Theming and responsive UI

## API Endpoints

- Auth
  - POST `/auth/refresh`
- Files
  - GET `/files` (query: `parent`, `q`, `type`, `owner`, `status`, `sort`)
  - GET `/files/recent` (query: `limit`, `type`)
  - GET `/files/meta?ids=...`
  - GET `/files/:id/preview`
  - GET `/files/:id/download`
  - GET `/files/:id/shares`
  - GET `/files/:id/versions`
  - POST `/files/upload`
  - POST `/files/folder`
  - POST `/files/:id/move`
  - POST `/files/:id/share/link`
  - PATCH `/files/:id/favorite`
  - GET `/files/shared`
  - GET `/files/shared/by-me`
  - GET `/files/favorites/check?ids=...`
  - DELETE `/files/shares/:shareId`
  - PATCH `/share/:fileId/:shareId` (body: `permission`)
  - GET `/files/trash`
  - POST `/files/:id/restore`
  - DELETE `/files/:id/permanent`
- Folders
  - GET `/folders/:folderId/path`
- Comments
  - GET `/files/:fileId/comments`
  - POST `/files/:fileId/comments`
  - PATCH `/files/comments/:commentId`
  - DELETE `/files/comments/:commentId`
  - POST `/files/comments/:commentId/reactions`
- Public Share
  - GET `/public/share/:shareId`
  - GET `/public/share/:shareId/download`
- Activity
  - GET `/users/activity` (query: `limit`)
- Admin
  - GET `/admin/users`
  - PATCH `/admin/users/:id/storage` (body: `limit`)
- Offline
  - GET `/offline/manifest`

## Setup

1. Install Node.js 18+
2. Set API URL in `frontend/.env.local`
   - `NEXT_PUBLIC_API_URL=http://localhost:5000/api`
3. Install dependencies
   - `cd frontend`
   - `npm install`

## Run

- Development
  - `cd frontend`
  - `npm run dev`
- Production
  - `cd frontend`
  - `npm run build`
  - `npm start`
