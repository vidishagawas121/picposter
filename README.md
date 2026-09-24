# PicPoster Backend & Admin Dashboard

PicPoster is a poster generation and digital branding platform designed for festival greetings, daily quotes, and business marketing.

## Features
- **REST API:** Node.js & Express.js with MongoDB (Mongoose).
- **Authentication:** JWT access tokens with rotating refresh tokens and mobile OTP verification.
- **Image Processing Pipeline:** Sharp for automated WebP compression and thumbnail generation.
- **Admin Dashboard:** React 18 + Vite + Material UI (MUI) for managing categories, poster templates, bulk uploads, sequence ordering, and user support queries.

## Project Structure
- `src/` - Backend Express API server, routes, controllers, and models.
- `picposter-dashboard/` - Admin web application.
- `uploads/` - Storage directory for uploaded images and generated assets.

## Getting Started

### Backend
```bash
npm install
npm run dev
```

### Admin Dashboard
```bash
cd picposter-dashboard
npm install
npm run dev
```
