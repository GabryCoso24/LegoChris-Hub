# LegoChris Hub

A comprehensive web application for managing content, e-commerce, and community engagement for the LegoChris YouTube channel.

🌐 **[Visit Live Site](https://legochris.ideovision.com)**

**[Documentation](#table-of-contents) | [Features](#features) | [Quick Start](#quick-start) | [Deployment](#deployment)**

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Technology Stack](#technology-stack)
4. [Prerequisites](#prerequisites)
5. [Quick Start](#quick-start)
6. [Configuration](#configuration)
7. [Project Structure](#project-structure)
8. [API Reference](#api-reference)
9. [Admin Panel](#admin-panel)
10. [Custom UI Components](#custom-ui-components)
11. [Database](#database)
12. [Email System](#email-system)
13. [Payment Integration](#payment-integration)
14. [Authentication & Authorization](#authentication--authorization)
15. [Mobile Access](#mobile-access)
16. [Deployment](#deployment)
17. [Troubleshooting](#troubleshooting)
18. [Contributing](#contributing)

---

## Overview

LegoChris Hub is a full-stack web application designed to provide a complete platform for content creators. It combines video management, e-commerce capabilities, community features, and administrative tools in a modern, responsive interface.

The application is built with a React frontend powered by Vite and Express backend with LowDB for local data persistence.

---

## Features

### Core Features

✅ **Dynamic Homepage**
- Hero section with CTAs
- Features showcase
- Latest video updates
- Community highlights

✅ **Video Management**
- YouTube playlist integration
- Video showcase with metadata
- Categorized video library
- Responsive grid layouts

✅ **E-Commerce System**
- Stripe payment integration
- Shopping cart with persistence
- Product inventory management
- Order tracking and history
- Free shipping thresholds
- Secure checkout process

✅ **Community Management**
- Staff member profiles
- Team member showcase
- Event scheduling and promotion
- Discord community integration

✅ **Content Scheduling**
- Weekly programming schedule
- Live stream and video announcements
- Team Plus member personal schedules
- Display order customization

✅ **Newsletter System**
- Email subscription management
- Gmail integration with Nodemailer
- Welcome emails
- Newsletter campaign distribution
- Subscriber analytics

✅ **User Authentication**
- Supabase OAuth authentication
- Google login integration
- Password reset via email
- User profile management
- Session persistence

✅ **Admin Dashboard**
- Protected admin panel
- Content management
- Order management
- Subscriber analytics
- Staff and team management
- Schedule configuration
- Product inventory

✅ **Design & UX**
- Fully responsive design (mobile, tablet, desktop)
- Modern UI components with shadcn/ui
- GDPR-compliant cookie consent
- Dark mode support
- Particle and glow effects
- Smooth scroll reveals
- Custom date/time pickers (replacing native inputs)
- Custom HSL color picker with visual selector
- Custom AlertDialog components (replacing browser alerts)
- Mobile-optimized layouts and touch controls
- SVG placeholders for missing images
- Dynamic "time ago" formatting for dates

✅ **Security**
- CORS protection
- Admin password authentication
- Role-based access control (Admin, Team Plus)
- Secure password reset tokens
- Environment variable management

---

## Technology Stack

### Frontend

| Technology | Purpose |
|-----------|---------|
| **React 18** | UI library and component framework |
| **Vite** | Build tool and development server |
| **TypeScript** | Type safety and better DX |
| **Tailwind CSS** | Utility-first CSS framework |
| **shadcn/ui** | High-quality UI component library |
| **React Router** | Client-side routing |
| **date-fns** | Date formatting and localization (Italian) |
| **Lucide Icons** | Icon library |

### Backend

| Technology | Purpose |
|-----------|---------|
| **Node.js** | JavaScript runtime |
| **Express** | Web framework |
| **LowDB** | JSON-based database |
| **Multer** | File upload middleware |
| **Nodemailer** | Email delivery |
| **Stripe** | Payment processing |
| **CORS** | Cross-origin request handling |

### Infrastructure

| Service | Purpose |
|---------|---------|
| **Supabase** | Authentication and user management |
| **Stripe** | Payment processing and webhooks |
| **Gmail** | Email delivery |

---

## Prerequisites

- **Node.js** v18 or higher
- **npm** or **yarn** package manager
- **Git** for version control
- Supabase account (free tier available)
- Stripe account (test keys for development)
- Gmail account (for email features)

---

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/legochris-hub.git
cd legochris-hub
```

### 2. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server && npm install && cd ..
```

### 3. Configure Environment Variables

#### Frontend (.env)

Create `.env` in the project root:

```env
# Admin Panel Password
VITE_ADMIN_PASSWORD=your_secure_password_here

# API Configuration (optional, defaults to http://localhost:3001)
VITE_API_URL=http://localhost:3001

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Backend (server/.env)

Create `server/.env`:

```env
# Email Configuration (Gmail)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your_16_char_app_password
FROM_NAME=Your Name

# Frontend URL (for email links)
FRONTEND_URL=https://domain.example
# For development use: http://localhost:5173

# Payment Processing
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Allowed Origins (CORS)
ALLOWED_ORIGINS=https://domain.example,http://localhost:5173

# Backend Configuration
BACKEND_URL=http://localhost:3001
PORT=3001
```

### 4. Start Development Servers

**Terminal 1 - Frontend:**

```bash
npm run dev
```

Frontend will be available at: http://localhost:5173

**Terminal 2 - Backend:**

```bash
cd server && npm run dev
```

Backend will be available at: http://localhost:3001

---

## Configuration

### Supabase Setup

#### 1. Create Project

1. Go to https://supabase.com/dashboard
2. Create a new project
3. Wait for provisioning to complete

#### 2. Configure Authentication

1. Navigate to **Authentication** → **Providers**
2. Click **Email**
3. **Disable** "Confirm email" option (allows instant login)
4. **Save**

#### 3. OAuth Configuration (Google/Discord)

1. Go to **Authentication** → **URL Configuration**
2. Add Redirect URLs:
   ```
   http://localhost:5173
   http://localhost:5173/
   http://192.168.1.XXX:5173    # Your local IP
   ```
3. Set **Site URL**:
   ```
   http://localhost:5173
   ```
4. **Save**

#### 4. Get Connection Keys

1. Go to **Project Settings** → **API**
2. Copy:
   - Project URL → `VITE_SUPABASE_URL`
   - Anon Key → `VITE_SUPABASE_ANON_KEY`

### Gmail Setup

#### 1. Enable 2FA

1. Go to https://myaccount.google.com/security
2. Scroll to "Signing in to Google"
3. Enable "2-Step Verification"

#### 2. Generate App Password

1. Go to https://myaccount.google.com/apppasswords
2. Select:
   - App: **Mail**
   - Device: **Other (custom name)**
   - Name: "LegoChris Newsletter"
3. Click **Generate**
4. Copy the 16-character password
5. Add to `server/.env` as `GMAIL_APP_PASSWORD`

### Stripe Setup

#### 1. Get API Keys

1. Go to https://dashboard.stripe.com/apikeys
2. Copy test keys (start with `sk_test_` and `pk_test_`)
3. Add `STRIPE_SECRET_KEY` to `server/.env`

#### 2. Configure Webhooks (Optional)

For real-time payment confirmation:

```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Forward webhooks to local server
stripe listen --forward-to localhost:3001/api/webhook/stripe

# Copy webhook secret to .env
# STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

---

## Project Structure

```
legochris-hub/
├── src/                                # React Frontend
│   ├── components/
│   │   ├── admin/                     # Admin panel components
│   │   │   ├── EventsManager.tsx
│   │   │   ├── NewsletterManager.tsx
│   │   │   ├── PlaylistManager.tsx
│   │   │   ├── ScheduleManager.tsx
│   │   │   ├── ShopManager.tsx
│   │   │   ├── StaffManager.tsx
│   │   │   ├── TeamManager.tsx
│   │   │   ├── TeamPlusScheduleManager.tsx
│   │   │   └── VideosManager.tsx
│   │   ├── effects/                   # Visual effects
│   │   │   ├── GlowOrb.tsx
│   │   │   ├── ParticleBackground.tsx
│   │   │   └── ScrollReveal.tsx
│   │   ├── home/                      # Homepage components
│   │   │   ├── DiscordCTA.tsx
│   │   │   ├── FeaturesSection.tsx
│   │   │   ├── HeroSection.tsx
│   │   │   ├── LatestVideos.tsx
│   │   │   └── NewsletterSection.tsx
│   │   ├── layout/                    # Layout components
│   │   │   ├── Footer.tsx
│   │   │   ├── Layout.tsx
│   │   │   ├── Navbar.tsx
│   │   │   └── UserMenu.tsx
│   │   ├── ui/                        # shadcn/ui components
│   │   └── Cookie​Consent.tsx         # GDPR cookie banner
│   ├── contexts/
│   │   ├── AuthContext.tsx            # Authentication state
│   │   └── CartContext.tsx            # Shopping cart state
│   ├── hooks/
│   │   ├── use-admin.tsx              # Admin role hook
│   │   ├── use-team-plus.tsx          # Team Plus role hook
│   │   ├── use-mobile.tsx             # Mobile detection
│   │   ├── use-cookie-consent.ts      # Cookie consent state
│   │   └── use-toast.ts               # Toast notifications
│   ├── integrations/
│   │   └── supabase/                  # Supabase integration
│   ├── lib/
│   │   ├── api.ts                     # API configuration
│   │   ├── imageUtils.ts              # Image utilities
│   │   └── utils.ts                   # General utilities
│   ├── pages/                          # Page components
│   │   ├── Admin.tsx
│   │   ├── Cart.tsx
│   │   ├── Community.tsx
│   │   ├── Login.tsx
│   │   ├── Profile.tsx
│   │   ├── Shop.tsx
│   │   ├── Schedule.tsx
│   │   ├── TeamPlus.tsx
│   │   └── [...other pages]
│   ├── assets/                        # Static assets
│   ├── App.tsx                        # Main app component
│   ├── main.tsx                       # Entry point
│   └── index.css                      # Global styles
├── server/                            # Express Backend
│   ├── index.js                       # Main server file
│   ├── data.json                      # JSON Database
│   ├── emailTemplates.js              # Email templates
│   ├── uploads/                       # Uploaded files
│   └── package.json
├── public/                            # Public assets
│   ├── robots.txt
│   └── discord-mock/                  # Mock data
├── vite.config.ts                     # Vite configuration
├── tailwind.config.ts                 # Tailwind configuration
├── tsconfig.json                      # TypeScript configuration
├── .env                               # Environment variables (frontend)
└── README.md
```

---

## API Reference

### Public Endpoints

#### Team & Staff
```
GET  /api/team              # Get all team members
GET  /api/staff             # Get all staff members
```

#### Content
```
GET  /api/videos            # Get featured videos
GET  /api/playlists         # Get video playlists
```

#### Events & Schedule
```
GET  /api/events            # Get upcoming events
GET  /api/schedule          # Get weekly schedule
GET  /api/team-plus-schedule # Get Team Plus schedules
```

#### Products & Orders
```
GET  /api/products          # Get shop products
GET  /api/user-orders       # Get user's orders (authenticated)
POST /api/create-checkout-session # Create Stripe checkout
```

#### Newsletter
```
POST /api/newsletter        # Subscribe to newsletter
```

#### File Upload
```
POST /api/upload           # Upload image file
```

### Admin Endpoints

All admin endpoints require authentication and proper role permissions.

#### CRUD Operations
```
POST   /api/[resource]              # Create
PUT    /api/[resource]/:id          # Update
DELETE /api/[resource]/:id          # Delete
PUT    /api/[resource]/reorder      # Reorder items
```

**Resources:**
- `team`
- `staff`
- `events`
- `schedule`
- `team-plus-schedule`
- `products`
- `playlists`
- `videos`
- `newsletter`

---

## Admin Panel

### Access

Navigate to `/admin` and enter the admin password configured in `VITE_ADMIN_PASSWORD`.

### Sections

#### 1. Staff Management
- Add/edit/delete staff members
- Upload staff avatars
- Set roles and descriptions
- customize display order

#### 2. Team Management
- Manage team members
- Assign roles (Team Base, Team Plus, etc.)
- Upload team avatars
- Configure descriptions

#### 3. Event Management
- Create upcoming events
- Set event dates and times
- Add event descriptions and images
- Link to event pages

#### 4. Schedule Management
- Create weekly schedule
- Set video/live stream times
- Add descriptions and thumbnails
- Link to video/stream URLs

#### 5. Team Plus Schedule
- Team members manage personal schedules
- Personal programming display
- Separate from main schedule

#### 6. Shop Management
- Add/edit products
- Set prices and SKUs
- Manage inventory
- Upload product images

#### 7. Playlist Management
- Link YouTube playlists
- Add descriptions
- Update playlist information

#### 8. Videos Management
- Feature recent videos
- Upload thumbnails
- Set view counts and dates
- Link to YouTube

#### 9. Newsletter
- View all subscribers
- Send newsletters (via email)
- Track email opens

---

## Custom UI Components

The admin panel features several custom-built UI components designed to provide a consistent, cross-browser experience and better mobile support.

### Custom Date/Time Picker

Replaces native `datetime-local` inputs with a custom implementation using shadcn/ui Calendar and Select components.

**Features:**
- Consistent appearance across all browsers
- Mobile-friendly touch interface
- Separate hour and minute selectors
- Italian locale support with date-fns
- Proper state management and validation

**Components:**
- `Calendar` (react-day-picker) for date selection
- `Select` dropdowns for hour (00-23) and minute (00/15/30/45)
- `Popover` for calendar display

**Used in:**
- EventsManager (event date and time)
- VideosManager (upload date with "time ago" display)

### Custom Color Picker

Custom HSL color picker replacing native `input[type="color"]` for better control and consistency.

**Features:**
- 2D saturation/lightness visual selector
- Horizontal hue slider
- Real-time HEX input field
- Common color palette (6 preset colors)
- Drag-and-drop color selection
- Mobile-responsive sizing

**Implementation:**
- HSL color space for better visual selection
- `hslToHex()` and `hexToHsl()` conversion functions
- Position indicator showing selected color point
- Mouse drag handlers for smooth color picking

**Used in:**
- ShopManager (product color variants)

### Custom Alert Dialogs

Replaces browser-native `alert()` and `confirm()` with themed shadcn/ui components.

**Benefits:**
- Consistent with application theme
- Better mobile UX
- Customizable content and actions
- Non-blocking and accessible

**Implementation:**
- `AlertDialog` for confirmations (delete actions)
- `toast` notifications for info messages
- Italian language support

**Used in:**
- NewsletterManager (info messages)
- ScheduleManager (delete confirmations)
- TeamPlusScheduleManager (delete confirmations)
- VideosManager (delete confirmations)
- EventsManager (delete confirmations)

### Dynamic Date Formatting

Videos and events display relative time using date-fns `formatDistanceToNow()`.

**Features:**
- Italian locale ("2 giorni fa", "3 settimane fa")
- Automatic updates (no manual "time ago" text)
- Date validation to prevent errors
- Fallback for invalid dates

**Example:**
```typescript
{!isNaN(new Date(video.date).getTime()) && 
  formatDistanceToNow(new Date(video.date), { 
    addSuffix: true, 
    locale: itLocale 
  })
}
```

### Mobile Optimizations

All admin forms are optimized for mobile devices:
- Responsive button sizing (w-10 on mobile, w-20 on desktop)
- Flexible layouts with proper gap spacing
- Touch-friendly input sizes
- Overflow prevention with `flex-shrink-0` and `min-w-0`
- SVG placeholders for missing images

---

## Database

### Schema (data.json)

```json
{
  "team": [{ id, name, description, role, avatar?, display_order, created_at }],
  "staff": [{ id, name, role, description, avatar?, display_order, created_at }],
  "events": [{ id, title, description, date, thumbnail?, created_at }],
  "schedule": [{ id, title, type, day_of_week, time, description, link, thumbnail?, display_order }],
  "team_plus_schedule": [{ id, user_id, user_name, title, type, day_of_week, time, description, link, thumbnail?, display_order }],
  "products": [{ id, title, price, sku?, image?, created_at }],
  "playlists": [{ id, title, description, youtube_link, created_at }],
  "videos": [{ id, title, thumbnail, duration, views, date, video_link, created_at }],
  "newsletter": [{ id, email, name, subscribed_at }],
  "orders": [{ id, user_id, items[], total, status, created_at }],
  "passwordResetTokens": [{ email, token, expires, created_at }]
}
```

---

## Email System

### Configured Email Types

#### 1. Welcome Email
Sent automatically upon user registration.

**Template:** Professional onboarding email with community overview

#### 2. Password Reset Email
Sent when user requests password reset.

**Features:**
- Secure token-based reset link
- 1-hour expiration
- Clear instructions

#### 3. Order Receipt Email
Sent upon successful payment completion.

**Includes:**
- Order number and date
- Product details
- Total with shipping
- Tracking information

#### 4. Newsletter Emails
Manual campaign distribution to subscribers.

**Features:**
- HTML-formatted templates
- Branding consistency
- Subscriber management

### Configuration

Emails are sent via Gmail using Nodemailer. See [Gmail Setup](#gmail-setup) section.

**Important:** Set `FRONTEND_URL` in `server/.env` to your domain for correct email links:
```env
FRONTEND_URL=https://domain.example
```

### Email Templates

Located in `server/emailTemplates.js`. All templates are optimized for maximum compatibility across email clients.

#### Mobile Email Client Optimization

All email templates include specific optimizations for Android and iPhone:

**Inline Styles with !important:**
- All text elements have explicit `style="color: #FFFFFF !important;"`
- Prevents white-text-on-white-background issues on Android
- Ensures consistent rendering across Gmail, Outlook, Apple Mail

**Template Structure:**
```javascript
<h1 style="color: #FFFFFF !important; margin: 0 0 24px 0;">Welcome!</h1>
<p style="color: #FFFFFF !important; margin: 0 0 16px 0;">Content here</p>
<a href="${link}" style="color: #FFFFFF !important;">Click here</a>
```

**Available Templates:**
1. `welcomeEmail(userName)` - User registration
2. `passwordResetEmail(resetLink)` - Password recovery
3. `orderConfirmationEmail(orderId, items, total)` - Purchase receipt
4. `newsletterEmail(subject, content)` - Marketing campaigns

**Best Practices:**
- Always use inline styles
- Include `!important` for color declarations
- Test on multiple email clients (Gmail, iPhone Mail, Outlook)
- Use tables for layout (better email client support)
- Absolute URLs for all links and images

---

## Payment Integration

### Stripe Checkout Flow

1. **Add to Cart** - User selects products
2. **View Cart** - Review items (`/cart`)
3. **Checkout** - Initiate Stripe session
4. **Payment** - Stripe hosted checkout
5. **Confirmation** - Order stored in database
6. **Receipt Email** - Automatic confirmation email

### Features

✅ Persistent cart (localStorage)
✅ Free shipping threshold (€50+)
✅ Secure payment processing
✅ Order tracking
✅ Webhook confirmation

### Test Cards

Use these Stripe test cards in development:

```
Visa:           4242 4242 4242 4242
Mastercard:     5555 5555 5555 4444
Amex:           3782 822463 10005

Expiry:         Any future date
CVC:            Any 3/4 digits
```

---

## Authentication & Authorization

### User Roles

#### Regular User
- Browse content
- Make purchases
- View profile
- Subscribe to newsletter

#### Team Plus Member
- All regular user features
- Personal schedule management
- Team Plus section access
- Personal content programming

#### Administrator
- All features
- Full content management
- Staff management
- Complete admin access

### Role Assignment (Supabase)

#### Add Admin Role

1. Go to Supabase Dashboard
2. **Authentication** → **Users**
3. Select user → **Edit User**
4. Modify **User Metadata**:
   ```json
   {
     "roles": ["admin"]
   }
   ```

#### Add Team Plus Role

1. Same process, modify metadata:
   ```json
   {
     "roles": ["team_plus"]
   }
   ```

#### Multiple Roles

```json
{
  "roles": ["admin", "team_plus"]
}
```

---

## Mobile Access

### Local Network Access

Access the application from mobile devices on the same WiFi network:

#### 1. Find Computer IP Address

**Windows:**
```bash
ipconfig
```
Look for IPv4 address (e.g., 192.168.1.100)

**Mac/Linux:**
```bash
ifconfig
```

#### 2. Update Environment Variables

Update `VITE_API_URL` in `.env`:

```env
VITE_API_URL=http://192.168.1.100:3001
```

#### 3. Restart Servers

```bash
npm run dev      # Frontend Terminal
cd server && npm run dev  # Backend Terminal
```

#### 4. Access from Mobile

Open browser on mobile device:
```
http://192.168.1.100:5173
```

### Firewall Configuration

Ensure firewall allows inbound connections:

**Windows Firewall:**
1. Search "Windows Firewall"
2. Click "Allow an app through firewall"
3. Add rules for ports 3001 and 5173

**Mac Firewall:**
1. System Preferences → Security & Privacy → Firewall
2. Click "Firewall Options"
3. Verify application access

---

## Deployment

### Frontend Deployment (Vercel/Netlify)

#### 1. Build Application

```bash
npm run build
```

Creates optimized build in `dist/` directory.

#### 2. Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Follow prompts to deploy.

#### 3. Configure Environment

Set variables in deployment platform:
```
VITE_ADMIN_PASSWORD=your_password
VITE_API_URL=https://api.yourdomain.com
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

#### 4. Deploy to Netlify

1. Connect GitHub repository
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add environment variables
5. Deploy

### Backend Deployment (Railway/Render)

#### 1. Prepare Backend

Ensure `server/` has proper `package.json` and `index.js`.

#### 2. Deploy to Railway

1. Go to https://railway.app
2. Create new project
3. Connect GitHub repository
4. Select `server/` directory
5. Add environment variables
6. Deploy

#### 3. Deploy to Render

1. Go to https://render.com
2. Create new Web Service
3. Connect GitHub repository
4. Set build command: `cd server && npm install`
5. Set start command: `node index.js`
6. Add environment variables
7. Deploy

#### 4. Update Frontend API URL

After backend deployment, update `VITE_API_URL`:
```
VITE_API_URL=https://api-yourdomain.onrender.com
```

### Database Backup

LowDB uses JSON file. For production:

1. **Backup `data.json`** regularly
2. **Version control** with Git
3. **Monitor file size** (consider migration to SQL for scale)

---

## Troubleshooting

### Common Issues

#### 1. "Cannot find module '@/components/...'"

**Solution:**
- Check file exists in correct location
- Verify import path matches file name
- Restart dev server

#### 2. Mobile pages not loading

**Solution:**
- Verify WiFi connection between devices
- Check IP address is correct (`ipconfig`)
- Ensure `VITE_API_URL` matches
- Check firewall settings

#### 3. Images not loading on mobile

**Solution:**
- Restart frontend server after `.env` changes
- Clear browser cache
- Verify images uploaded from admin panel
- Check API URL configuration

#### 4. Stripe payment fails

**Solution:**
- Verify `STRIPE_SECRET_KEY` is correct
- Check test mode is enabled
- Use provided test card numbers
- Check server logs for errors

#### 5. Emails not sending

**Solution:**
- Enable 2FA on Gmail account
- Verify app password (16 characters)
- Check `GMAIL_USER` email is correct
- Verify SMTP connection in server logs

#### 6. Login not working

**Solution:**
- Verify Supabase credentials
- Check email verification disabled (if desired)
- Clear browser cookies/cache
- Verify network connectivity

### Debug Mode

Enable detailed logging:

**Frontend:**
```typescript
// In src/App.tsx
localStorage.setItem('DEBUG', 'true');
```

**Backend:**
```javascript
// In server/index.js
process.env.DEBUG = 'true';
console.log('Debug output:', data);
```

---

## Contributing

### Development Workflow

1. **Create feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Make changes**
   - Write clean, documented code
   - Follow existing patterns
   - Test thoroughly

3. **Commit changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```

4. **Push and create PR**
   ```bash
   git push origin feature/amazing-feature
   ```

### Code Style

- **TypeScript** - Use type safety
- **Naming** - camelCase for variables/functions, PascalCase for components
- **Comments** - Document complex logic
- **Formatting** - Use Prettier/ESLint rules

---

## License

This project is proprietary. All rights reserved.

---

## Support & Contact

### Report Issues

Found a bug? Open an issue on GitHub with:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots/logs if applicable

### Connect

- **YouTube:** [LegoChris](https://youtube.com/legochris)
- **Discord:** [Join Community](https://discord.gg/legochris)
- **Email:** Available in footer

---

## Changelog

### Version 1.0.0 (Current)

✅ Full feature release
- Complete frontend and backend
- Payment integration
- Email system with mobile optimization
- Custom UI components (date pickers, color picker, alert dialogs)
- Admin panel with enhanced UX
- Mobile-responsive design
- Role-based access control
- Italian localization for dates
- Dynamic "time ago" formatting
- Cross-browser compatibility improvements

### Recent Updates (February 2026)

🎨 **UI/UX Enhancements:**
- Custom HSL color picker with 2D selector
- Custom date/time pickers replacing native inputs
- Custom AlertDialog components replacing browser alerts
- Mobile-optimized button sizing and layouts
- SVG placeholders for missing images

📧 **Email System:**
- Android/iPhone rendering optimization
- Inline styles with !important flags
- FRONTEND_URL configuration for correct email links
- All 6 templates updated for cross-client compatibility

🔧 **Admin Panel:**
- Enhanced mobile responsiveness
- Improved form validation
- Dynamic date formatting with Italian locale
- Better error handling and user feedback

---

## Acknowledgments

Built with 🧱 for the LegoChris community.

- By gabrycoso, IdeoVision Development Team

---

**Last Updated:** February 2026
