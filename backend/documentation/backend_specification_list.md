# 📋 PicPoster — Complete Backend Architecture, Database Schema, Models & Services Specification

> **Target Audience**: Backend Engineering Team (Node.js + Express.js + MongoDB + Redis/S3)  
> **Client**: PicPoster Flutter Application (Android & iOS)  
> **Document Purpose**: Single Source of Truth for Database Collections, Field Types, DTO Models, API Contracts, Services, and Business Logic required by the Flutter Mobile Client.

---

## 📑 Table of Contents
1. [System Overview & Global Standards](#1-system-overview--global-standards)
2. [MongoDB Collections & Schema Definitions](#2-mongodb-collections--schema-definitions)
   - [2.1 `users` Collection](#21-users-collection)
   - [2.2 `business_profiles` Collection](#22-business_profiles-collection)
   - [2.3 `categories` Collection](#23-categories-collection)
   - [2.4 `posters` Collection](#24-posters-collection)
   - [2.5 `user_creations` Collection](#25-user_creations-collection)
   - [2.6 `otps` Collection (or Redis)](#26-otps-collection-or-redis)
   - [2.7 `refresh_tokens` Collection](#27-refresh_tokens-collection)
   - [2.8 `support_queries` Collection](#28-support_queries-collection)
3. [Global Response Envelope & Error Formats](#3-global-response-envelope--error-formats)
4. [Frontend DTO Models $\leftrightarrow$ Backend Payload Mapping](#4-frontend-dto-models--backend-payload-mapping)
5. [Frontend Services & REST API Endpoints Specification](#5-frontend-services--rest-api-endpoints-specification)
   - [5.1 `AuthService` Endpoints (`/api/v1/auth`)](#51-authservice-endpoints)
   - [5.2 `UserService` Endpoints (`/api/v1/user`)](#52-userservice-endpoints)
   - [5.3 `BusinessService` Endpoints (`/api/v1/business`)](#53-businessservice-endpoints)
   - [5.4 `PosterService` Endpoints (`/api/v1/posters`)](#54-posterservice-endpoints)
   - [5.5 `SupportService` Endpoints (`/api/v1/support`)](#55-supportservice-endpoints)
6. [Media Storage & Image Processing Pipeline](#6-media-storage--image-processing-pipeline)
7. [Security, Token Rotation & Rate Limiting Architecture](#7-security-token-rotation--rate-limiting-architecture)

---

## 1. System Overview & Global Standards

| Attribute | Standard / Convention |
| :--- | :--- |
| **API Base URL (Dev Emulator)** | `http://10.0.2.2:5000/api/v1` |
| **API Base URL (Production)** | `https://api.picposterapp.com/api/v1` |
| **Authentication Scheme** | JWT Bearer Authentication (`Authorization: Bearer <accessToken>`) |
| **Access Token Lifetime** | 15 Minutes (`expiresIn: 900`) |
| **Refresh Token Lifetime** | 30 Days (`expiresIn: 2592000`) with Single-Use Rotation |
| **Data Format** | UTF-8 JSON (`Content-Type: application/json`) |
| **File Upload Format** | `multipart/form-data` (Processed to WebP, quality 85%) |
| **Primary Keys** | MongoDB `_id` mapped to `id` in Flutter models |
| **Timestamps** | ISO 8601 (`createdAt`, `updatedAt`) |

---

## 2. MongoDB Collections & Schema Definitions

### 2.1 `users` Collection
Stores user identity, verification status, preferred language, and profile metadata.

```javascript
const userSchema = new mongoose.Schema({
  mobile: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true // e.g., "+919876543210" (E.164 Format)
  },
  name: {
    type: String,
    default: "User",
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    default: "",
    trim: true,
    lowercase: true
  },
  profilePhoto: {
    type: String,
    default: "" // CDN / S3 WebP image URL
  },
  preferredLanguage: {
    type: String,
    enum: ['English', 'Hindi', 'Marathi', 'Gujarati', 'Punjabi', 'Tamil', 'Telugu', 'Bengali'],
    default: 'English'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  }
}, { timestamps: true });
```

| Field Name | Type | Required | Default | Description |
| :--- | :--- | :---: | :--- | :--- |
| `_id` | ObjectId | Yes | Auto | Unique User Document ID |
| `mobile` | String | Yes | — | E.164 format mobile number (Primary Identifier) |
| `name` | String | No | `"User"` | User display name |
| `email` | String | No | `""` | Optional email address |
| `profilePhoto` | String | No | `""` | CDN URL to avatar |
| `preferredLanguage`| String | No | `"English"` | Poster language preference |
| `isVerified` | Boolean | No | `false` | Phone OTP verification status |
| `isActive` | Boolean | No | `true` | Account active flag |
| `role` | String | No | `"user"` | User authorization role |
| `createdAt` | Date | Auto | Current Date | Creation timestamp |
| `updatedAt` | Date | Auto | Current Date | Last modified timestamp |

---

### 2.2 `business_profiles` Collection
Stores company details, contact information, social links, and uploaded branding logos used for dynamic overlay rendering onto templates.

```javascript
const businessProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  companyName: {
    type: String,
    default: "",
    trim: true,
    maxlength: 120
  },
  businessAddress: {
    type: String,
    default: "",
    trim: true,
    maxlength: 250
  },
  contactNumber: {
    type: String,
    default: "",
    trim: true
  },
  businessMail: {
    type: String,
    default: "",
    trim: true,
    lowercase: true
  },
  website: {
    type: String,
    default: "",
    trim: true
  },
  tagline: {
    type: String,
    default: "",
    trim: true
  },
  businessLogoUrls: [{
    type: String // Array of CDN WebP image URLs
  }],
  socialHandles: {
    instagram: { type: String, default: "" },
    facebook: { type: String, default: "" },
    twitter: { type: String, default: "" },
    youtube: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    whatsapp: { type: String, default: "" }
  }
}, { timestamps: true });
```

| Field Name | Type | Required | Default | Description |
| :--- | :--- | :---: | :--- | :--- |
| `_id` | ObjectId | Yes | Auto | Unique Business Document ID |
| `userId` | ObjectId | Yes | — | Reference to `users._id` (One-to-One) |
| `companyName` | String | No | `""` | Business / Store / Agency name |
| `businessAddress` | String | No | `""` | Street / City physical address |
| `contactNumber` | String | No | `""` | Business phone / WhatsApp line |
| `businessMail` | String | No | `""` | Business email address |
| `website` | String | No | `""` | Website URL |
| `tagline` | String | No | `""` | Slogan / subtitle printed on poster |
| `businessLogoUrls`| Array[String] | No | `[]` | List of transparent/branded logo URLs |
| `socialHandles` | Object | No | `{}` | Social media usernames |
| `createdAt` / `updatedAt` | Date | Auto | Current Date | Timestamps |

---

### 2.3 `categories` Collection
Stores poster categories displayed on Home, Explore, and Template pages.

```javascript
const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true // e.g. "festivals", "business-quotes", "good-morning"
  },
  iconUrl: {
    type: String,
    default: ""
  },
  sortOrder: {
    type: Number,
    default: 0,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, { timestamps: true });
```

| Field Name | Type | Required | Default | Description |
| :--- | :--- | :---: | :--- | :--- |
| `_id` | ObjectId | Yes | Auto | Unique Category ID |
| `name` | String | Yes | — | Display category title (e.g., "Festivals") |
| `slug` | String | Yes | — | URL-safe slug (e.g., `"festivals"`) |
| `iconUrl` | String | No | `""` | Icon / badge image URL |
| `sortOrder` | Number | No | `0` | Sequence ranking in UI carousel |
| `isActive` | Boolean | No | `true` | Visibility toggle |

---

### 2.4 `posters` Collection
Stores all template assets, background artwork, dimensions, categorization, and engagement analytics.

```javascript
const posterSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  imageUrl: {
    type: String,
    required: true // High-res WebP template image URL
  },
  thumbnailUrl: {
    type: String,
    default: "" // Lightweight thumbnail for fast grid view
  },
  category: {
    type: String,
    required: true,
    index: true // Matches category slug
  },
  language: {
    type: String,
    default: "English",
    index: true // "English", "Hindi", "Marathi", "Gujarati", etc.
  },
  tags: [{
    type: String,
    index: true
  }],
  aspectRatio: {
    type: String,
    enum: ['1:1', '4:5', '9:16', '16:9'],
    default: '1:1'
  },
  isTrending: {
    type: Boolean,
    default: false,
    index: true
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  downloadsCount: {
    type: Number,
    default: 0
  },
  sharesCount: {
    type: Number,
    default: 0
  },
  viewsCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, { timestamps: true });

// Compound index for lightning-fast filtered catalog queries
posterSchema.index({ category: 1, language: 1, isActive: 1, createdAt: -1 });
```

| Field Name | Type | Required | Default | Description |
| :--- | :--- | :---: | :--- | :--- |
| `_id` | ObjectId | Yes | Auto | Unique Poster Template ID |
| `title` | String | Yes | — | Title of template (e.g. "Diwali Special") |
| `imageUrl` | String | Yes | — | Full resolution CDN image URL |
| `thumbnailUrl` | String | No | `""` | Compressed grid preview URL |
| `category` | String | Yes | — | Category slug |
| `language` | String | No | `"English"` | Language content of poster |
| `tags` | Array[String] | No | `[]` | Search keywords |
| `aspectRatio` | String | No | `"1:1"` | Canvas aspect ratio |
| `isTrending` | Boolean | No | `false` | Featured on Trending Carousels |
| `isPremium` | Boolean | No | `false` | Free vs Premium template |
| `downloadsCount` | Number | No | `0` | Incremented when user saves |
| `sharesCount` | Number | No | `0` | Incremented when user shares |
| `viewsCount` | Number | No | `0` | Incremented on impression |
| `isActive` | Boolean | No | `true` | Admin publish flag |

---

### 2.5 `user_creations` Collection
Tracks customized banners created and saved by users on the canvas editor.

```javascript
const userCreationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  posterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Poster',
    default: null
  },
  customizedImageUrl: {
    type: String,
    required: true // Rendered final banner image URL
  },
  customText: {
    type: String,
    default: ""
  },
  savedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });
```

---

### 2.6 `otps` Collection (or Redis Key-Value)
Tracks OTP requests, expiration, and verification attempts with automated TTL eviction.

```javascript
const otpSchema = new mongoose.Schema({
  mobile: {
    type: String,
    required: true,
    index: true
  },
  otpHash: {
    type: String,
    required: true // Bcrypt/Argon2 hash of 6-digit OTP
  },
  attempts: {
    type: Number,
    default: 0 // Lock out after 5 invalid attempts
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: '0s' } // MongoDB TTL index auto-deletes expired OTPs
  }
}, { timestamps: true });
```

---

### 2.7 `refresh_tokens` Collection
Maintains valid JWT refresh tokens per device for secure 401 token refreshment.

```javascript
const refreshTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  tokenHash: {
    type: String,
    required: true,
    index: true
  },
  deviceId: {
    type: String,
    required: true
  },
  platform: {
    type: String,
    enum: ['android', 'ios', 'web'],
    default: 'android'
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: '0s' } // 30-day TTL expiry
  }
}, { timestamps: true });
```

---

### 2.8 `support_queries` Collection
Receives customer contact form queries, bug reports, and partnership inquiries from `ContactUs`.

```javascript
const supportQuerySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  contact: {
    type: String,
    required: true,
    trim: true // Email or Mobile number
  },
  query: {
    type: String,
    required: true,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'resolved', 'closed'],
    default: 'pending',
    index: true
  }
}, { timestamps: true });
```

---

## 3. Global Response Envelope & Error Formats

All backend REST API endpoints MUST return responses formatted within standard JSON envelopes:

### Success Response (`200 OK`, `201 Created`)
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "page": 1,
  "totalPages": 5,
  "totalCount": 100
}
```

### Error Response (`400`, `401`, `403`, `404`, `409`, `422`, `500`)
```json
{
  "success": false,
  "message": "Human readable error message for UI display",
  "errorCode": "INVALID_OTP_CODE",
  "errors": [
    {
      "field": "otp",
      "message": "OTP has expired or is incorrect"
    }
  ]
}
```

---

## 4. Frontend DTO Models $\leftrightarrow$ Backend Payload Mapping

| Flutter Model Class | File Path | MongoDB Collection | JSON Keys / DTO Properties |
| :--- | :--- | :--- | :--- |
| **`UserModel`** | `lib/models/user_model.dart` | `users` | `_id` $\rightarrow$ `id`, `mobile`, `name`, `email`, `profilePhoto`, `preferredLanguage`, `isVerified` |
| **`AuthResponseModel`** | `lib/models/auth_response_model.dart` | `users` + `tokens` | `user` (UserModel), `tokens.accessToken`, `tokens.refreshToken`, `tokens.expiresIn` |
| **`BusinessInfoModel`** | `lib/models/business_model.dart` | `business_profiles` | `userId`, `companyName`, `businessAddress`, `contactNumber`, `businessMail`, `website`, `tagline`, `businessLogoUrls` (List), `socialHandles` (Map) |
| **`CategoryModel`** | `lib/models/category_model.dart` | `categories` | `_id` $\rightarrow$ `id`, `name`, `slug`, `iconUrl`, `sortOrder` |
| **`PosterModel`** | `lib/models/poster_model.dart` | `posters` | `_id` $\rightarrow$ `id`, `title`, `imageUrl`, `thumbnailUrl`, `category`, `language`, `aspectRatio`, `downloadsCount`, `sharesCount`, `isTrending` |
| **`ApiResponse<T>`** | `lib/models/api_response.dart` | Envelope | `success`, `message`, `data` (Generic), `page`, `totalPages`, `totalCount` |

---

## 5. Frontend Services & REST API Endpoints Specification

### 5.1 `AuthService` Endpoints

#### `POST /api/v1/auth/send-otp`
Sends a 6-digit SMS verification code to the given mobile number.
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "mobile": "+919876543210"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "OTP sent successfully to +919876543210",
    "data": {
      "cooldownSeconds": 60
    }
  }
  ```

#### `POST /api/v1/auth/verify-otp`
Validates the 6-digit code. If the user does not exist, registers them automatically. Returns user profile + JWT token pair.
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "mobile": "+919876543210",
    "otp": "492817",
    "deviceId": "uuid-v4-device-string",
    "platform": "android"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Authentication successful",
    "data": {
      "user": {
        "_id": "66ce78a1b9f42c12a84ef901",
        "mobile": "+919876543210",
        "name": "Rajesh Kumar",
        "email": "rajesh@example.com",
        "profilePhoto": "https://cdn.picposter.com/users/avatar_66ce.webp",
        "preferredLanguage": "English",
        "isVerified": true
      },
      "tokens": {
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5c...",
        "refreshToken": "d8f921e4a56c0b...",
        "expiresIn": 900
      }
    }
  }
  ```

#### `POST /api/v1/auth/refresh-token`
Exchanges an existing valid refresh token for a fresh 15-minute access token.
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "refreshToken": "d8f921e4a56c0b...",
    "deviceId": "uuid-v4-device-string"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5c...",
      "refreshToken": "new_rotated_refresh_token_optional...",
      "expiresIn": 900
    }
  }
  ```

#### `POST /api/v1/auth/logout`
Revokes the refresh token for the calling device.
- **Auth Required**: Yes (`Bearer <accessToken>`)
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

---

### 5.2 `UserService` Endpoints

#### `GET /api/v1/user/profile`
Fetches the currently authenticated user's profile.
- **Auth Required**: Yes
- **Response `200 OK`**: Returns `UserModel` in `data`.

#### `PUT /api/v1/user/profile`
Updates user display name, email, or language preference.
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "name": "Rajesh Kumar",
    "email": "rajesh@example.com",
    "preferredLanguage": "Hindi"
  }
  ```
- **Response `200 OK`**: Returns updated `UserModel`.

#### `POST /api/v1/user/photo`
Uploads avatar image using `multipart/form-data`.
- **Auth Required**: Yes
- **Payload**: `photo` (File: PNG/JPG/WebP)
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Profile photo updated",
    "data": {
      "photoUrl": "https://cdn.picposter.com/users/avatar_66ce.webp"
    }
  }
  ```

---

### 5.3 `BusinessService` Endpoints

#### `GET /api/v1/business`
Retrieves company info and logo list for the current user.
- **Auth Required**: Yes
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "userId": "66ce78a1b9f42c12a84ef901",
      "companyName": "Apex Digital Solutions",
      "businessAddress": "Plot 42, Tech Park, Pune",
      "contactNumber": "+919876543210",
      "businessMail": "contact@apexdigital.com",
      "website": "https://apexdigital.com",
      "tagline": "Your Growth Partner",
      "businessLogoUrls": [
        "https://cdn.picposter.com/logos/logo_01.webp"
      ],
      "socialHandles": {
        "instagram": "apex_digital",
        "facebook": "apexdigital",
        "whatsapp": "+919876543210"
      }
    }
  }
  ```

#### `PUT /api/v1/business`
Updates business information fields.
- **Auth Required**: Yes
- **Request Body**: Complete `BusinessInfoModel` JSON.
- **Response `200 OK`**: Returns updated `BusinessInfoModel`.

#### `POST /api/v1/business/logo`
Uploads a company logo file (`multipart/form-data`).
- **Auth Required**: Yes
- **Payload**: `logo` (File)
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "logoUrl": "https://cdn.picposter.com/logos/logo_02.webp"
    }
  }
  ```

#### `DELETE /api/v1/business/logo/:logoId`
Deletes a business logo by identifier or URL.
- **Auth Required**: Yes
- **Response `200 OK`**: `{ "success": true, "message": "Logo deleted" }`

---

### 5.4 `PosterService` Endpoints

#### `GET /api/v1/posters/categories`
Returns active category listing for carousels and filtering tabs.
- **Auth Required**: Optional
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "cat_festivals",
        "name": "Festivals",
        "slug": "festivals",
        "iconUrl": "https://cdn.picposter.com/icons/festivals.webp",
        "sortOrder": 1
      },
      {
        "_id": "cat_business",
        "name": "Business Quotes",
        "slug": "business-quotes",
        "iconUrl": "https://cdn.picposter.com/icons/business.webp",
        "sortOrder": 2
      }
    ]
  }
  ```

#### `GET /api/v1/posters`
Returns paginated poster templates with query filters.
- **Auth Required**: Optional
- **Query Parameters**:
  - `category` (optional, string: slug)
  - `language` (optional, string: e.g. "English", "Hindi")
  - `search` (optional, string)
  - `page` (optional, number, default: `1`)
  - `limit` (optional, number, default: `20`)
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "page": 1,
    "totalPages": 4,
    "totalCount": 68,
    "data": [
      {
        "_id": "poster_101",
        "title": "Ganesh Chaturthi Special",
        "imageUrl": "https://cdn.picposter.com/posters/ganesh_101.webp",
        "thumbnailUrl": "https://cdn.picposter.com/posters/ganesh_101_thumb.webp",
        "category": "festivals",
        "language": "Hindi",
        "aspectRatio": "1:1",
        "downloadsCount": 420,
        "sharesCount": 180,
        "isTrending": true
      }
    ]
  }
  ```

#### `POST /api/v1/posters/:id/action`
Increments download, share, or view analytics counter.
- **Auth Required**: Optional
- **Request Body**: `{ "action": "download" }` (or `"share"` / `"view"`)
- **Response `200 OK`**: `{ "success": true, "message": "Action recorded" }`

---

### 5.5 `SupportService` Endpoints

#### `POST /api/v1/support/contact`
Submits contact form queries from the mobile app.
- **Auth Required**: Optional
- **Request Body**:
  ```json
  {
    "name": "Amit Sharma",
    "contact": "+919811223344",
    "query": "I would like to request customized corporate templates for Diwali."
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "success": true,
    "message": "Your query has been submitted successfully."
  }
  ```

---

## 6. Media Storage & Image Processing Pipeline

1. **File Uploads**: All images sent via `POST /api/v1/user/photo` and `POST /api/v1/business/logo` are handled by `multer`.
2. **Sharp Image Optimization**:
   - Convert to **WebP format** with **85% quality**.
   - Strip all EXIF metadata for privacy and size reduction.
   - Resize avatars to max $500\times500$ px; logos to max $800\times800$ px with preserved alpha transparency.
3. **Cloud Storage**: Upload to AWS S3, Cloudinary, or DigitalOcean Spaces behind a Cloudflare / CDN edge cache.

---

## 7. Security, Token Rotation & Rate Limiting Architecture

1. **OTP Security**:
   - OTP codes are 6 numerical digits generated cryptographically (`crypto.randomInt(100000, 999999)`).
   - Only the Bcrypt hash of the OTP is stored in database / Redis.
   - Max 5 failed attempts allowed before the code is invalidated.
   - 60-second resend cooldown strictly enforced per mobile number.
2. **JWT Security**:
   - `accessToken`: 15 minutes validity, verified with `JWT_SECRET`.
   - `refreshToken`: 30 days validity, tied to `deviceId` and verified with `JWT_REFRESH_SECRET`.
   - On refresh, previous refresh token is deleted (Token Rotation).
3. **Rate Limiting**:
   - `express-rate-limit` enabled: Max 5 OTP requests per mobile number per hour.
   - General API limit: 120 requests/minute per IP.
