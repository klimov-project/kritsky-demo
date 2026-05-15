# Implementation Notes - Constructor and Profile Functionality

## Overview

This document describes the implementation of Constructor Panel functionality and Profile system features for the Nuxt 4 frontend application.

## Completed Features

### 1. Constructor Panel (Bottom Action Panel)

**Location:** `/app/components/variant/ActionPanel.vue`
**Features:**

- Download PDF: Generates a PDF using jsPDF and html2canvas
- Print: Opens system print dialog using window.print()
- Save to Profile: Saves variant to backend via POST /api/variants/save
- Share: Generates shareable link and copies to clipboard

**Integration:** Integrated into variant Footer component at `/app/components/variant/Footer.vue`

### 2. Profile Page (/profile/)

**Location:** `/app/pages/profile/index.vue`
**Features:**

- Tab system with 3 sections:
  1. Personal Data (default) - displays name, email, subscription status
  2. Subscription Management - redirects to /profile/subscription
  3. Payment History - redirects to /profile/payment-history
- Fetches user data from /api/auth/me via user store
- ProfileSidebar component for navigation
- Responsive layout with mobile support

### 3. My Variants Page (/profile/my-variants/)

**Location:** `/app/pages/profile/my-variants.vue`
**Features:**

- Displays list of saved test variants as cards
- Each card shows: title, creation date, and action buttons
- Action buttons:
  - Open: Navigates to shared variant view
  - Download: Shows info message (full functionality available in variant view)
  - Print: Shows info message (full functionality available in variant view)
  - Delete: Removes variant from profile (with confirmation)
- Fetches variants from /api/variants/list via variants store

### 4. Subscription Page (/profile/subscription/)

**Location:** `/app/pages/profile/subscription.vue`
**Features:**

- Current subscription status display
- Mock activation/deactivation buttons for testing
- Subscription plans display (Monthly/Yearly)
- Feature comparison
- Test mode section for development

**Mock Endpoints:**

- POST /api/subscription/activate-mock - activates test subscription
- POST /api/subscription/reset-mock - deactivates test subscription

### 5. Payment History Page (/profile/payment-history/)

**Location:** `/app/pages/profile/payment-history.vue`
**Features:**

- Displays payment history as table
- Mock data fallback if backend unavailable
- Date, amount, currency, description, status columns
- Fetches from GET /api/payments/history

### 6. Variant View Page (/variant/[id].vue)

**Location:** `/app/pages/variant/[id].vue`
**Features:**

- Displays shared variants
- Includes action panel for download/print/share
- Public access (no auth required for viewing)
- Can be accessed via shareable links

## Pinia Stores

### User Store (`/app/stores/user.ts`)

**State:**

- user: User | null
- quota: ExportQuota | null
- isLoading: boolean
- error: string | null

**Methods:**

- fetchUser() - fetches from /api/auth/me
- fetchQuota() - fetches from /api/variants/quota
- setUser() - updates user locally
- clearUser() - clears on logout

**Computed:**

- subscriptionExpiryFormatted - formatted date
- hasActiveSubscription - checks if subscription is active

### Variants Store (`/app/stores/variants.ts`)

**State:**

- savedVariants: SavedVariant[]
- isLoading: boolean
- error: string | null

**Methods:**

- fetchSavedVariants() - fetches from /api/variants/list
- saveVariant() - saves variant to /api/variants/save
- deleteVariant() - deletes variant
- getVariantById() - retrieves variant by ID

**Utilities:**

- formatDate() - formats dates for display
- getVariantTitle() - generates title from variant data

## Composables

### useVariantExport (`/app/composables/useVariantExport.ts`)

**Features:**

- downloadVariantPdf() - generates PDF from HTML element
- printVariant() - opens print dialog
- saveVariantToProfile() - saves to user profile
- generateShareableLink() - creates shareable link
- shareVariant() - uses Web Share API or fallback

### useSubscriptionMock (`/app/composables/useSubscriptionMock.ts`)

**Features:**

- activateSubscription() - mock subscription activation
- resetSubscription() - mock subscription deactivation
- fetchPaymentHistory() - fetches payment history

## Server API Routes

### Authentication Routes (Updated)

- POST /api/auth/login - Fixed to use config.apiBackendUrl
- POST /api/auth/register - Fixed to use config.apiBackendUrl
- GET /api/auth/me - Fixed to use config.apiBackendUrl
- PUT /api/auth/profile - Fixed to use config.apiBackendUrl
- POST /api/auth/change-password - Fixed to use config.apiBackendUrl
- POST /api/auth/refresh - Refreshes JWT tokens

### Variants Routes (New)

- GET /api/variants/list - Lists user's saved variants
- POST /api/variants/save - Saves new variant
- GET /api/variants/quota - Fetches user quota

### Subscription Routes (New)

- POST /api/subscription/activate-mock - Activates mock subscription
- POST /api/subscription/reset-mock - Deactivates mock subscription

### Payment Routes (New)

- GET /api/payments/history - Fetches payment history
- POST /api/payments/create - Creates payment (YooKassa)
- GET /api/payments/callback - Payment callback handler
- POST /api/payments/webhook - YooKassa webhook

## Components

### ProfileSidebar (`/app/components/profile/ProfileSidebar.vue`)

Navigation sidebar for profile pages with menu items:

- Personal Data
- Subscription
- Payment History
- My Variants

### VariantCard (`/app/components/profile/VariantCard.vue`)

Card component for displaying saved variants with action buttons.

### ActionPanel (`/app/components/variant/ActionPanel.vue`)

Action panel with download, print, save, and share buttons.

## Middleware

- auth.ts - Protects profile pages, redirects to login if not authenticated

## Environment Variables Required

```
NUXT_API_BACKEND_URL=http://62.113.99.250:8000/api
NUXT_SESSION_PASSWORD=your-32-char-password
YOOKASSA_SHOP_ID=your-shop-id
YOOKASSA_SECRET_KEY=your-secret-key
```

## Technical Stack

- Nuxt 4.4+ with Vue 3
- Pinia for state management
- Nuxt UI for components
- jsPDF + html2canvas for PDF generation
- nuxt-auth-utils for session management

## Known Limitations & Assumptions

1. Mock payment history is used when backend is unavailable
2. Shared variants are accessed via /variant/[id] (no database lookup yet)
3. PDF generation uses client-side rendering (no server-side generation)
4. YooKassa integration requires proper API keys in environment
5. Subscription status is mocked for testing (no real payment processing)

## Testing Checklist

- [ ] Profile page loads user data correctly
- [ ] Tabs navigate between sections
- [ ] My Variants page displays saved variants
- [ ] Variant cards show correct information
- [ ] Delete variant works with confirmation
- [ ] Download PDF generates file correctly
- [ ] Print opens browser print dialog
- [ ] Save to profile shows success toast
- [ ] Share button copies link to clipboard
- [ ] Subscription activation/deactivation works
- [ ] Payment history displays mock data
- [ ] Auth redirects to login when needed

## Future Improvements

1. Backend integration for variant storage
2. Real payment processing with YooKassa
3. Server-side PDF generation
4. Subscription webhook handling
5. Payment history backend integration
6. Variant search and filtering
7. Subscription analytics
8. Email notifications for payments

## Files Created/Modified

### New Files:

- /app/stores/user.ts
- /app/stores/variants.ts
- /app/composables/useVariantExport.ts
- /app/composables/useSubscriptionMock.ts
- /app/components/variant/ActionPanel.vue
- /app/components/profile/ProfileSidebar.vue
- /app/components/profile/VariantCard.vue
- /app/pages/profile/my-variants.vue
- /app/pages/profile/subscription.vue
- /app/pages/profile/payment-history.vue
- /app/pages/variant/[id].vue
- /server/api/variants/save.post.ts
- /server/api/variants/list.get.ts
- /server/api/variants/quota.get.ts
- /server/api/subscription/activate-mock.post.ts
- /server/api/subscription/reset-mock.post.ts
- /server/api/payments/history.get.ts

### Modified Files:

- /app/pages/profile/index.vue (added tabs system)
- /app/pages/profile/tariff.vue (YooKassa integration)
- /app/pages/profile/login.vue (login modal)
- /app/components/variant/Footer.vue (added ActionPanel)
- /app/stores/variants.ts (updated API endpoints)
- /app/stores/user.ts (updated quota endpoint)
- /app/layouts/default.vue (login modal integration)
- /app/composables/useAuth.ts (JWT token handling)
- /app/composables/useAuthApi.ts (authenticated requests)
- /nuxt.config.ts (added YooKassa config)
