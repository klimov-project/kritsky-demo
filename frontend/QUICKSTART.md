## Quick Start Guide

### Running the Application

```bash
cd functional/frontend
npm install
npm run dev
```

The application will start on `http://localhost:3003`

### Key Pages Implemented

1. **Profile Page** - `/profile/`
   - Main profile dashboard
   - Tab navigation (Personal Data, Subscription, Payment History)
   - Displays user info, subscription status, email

2. **My Variants** - `/profile/my-variants/`
   - Lists all saved test variants
   - Actions: Open, Download, Print, Delete
   - Fetches from GET /api/variants/list

3. **Subscription** - `/profile/subscription/`
   - Current subscription status
   - Mock activate/deactivate buttons
   - Plans display
   - POST /api/subscription/activate-mock
   - POST /api/subscription/reset-mock

4. **Payment History** - `/profile/payment-history/`
   - Displays payment records
   - Mock data fallback
   - GET /api/payments/history

5. **Variant View** - `/variant/[id].vue`
   - Public variant viewer
   - Action panel (Download, Print, Share)
   - Shareable link support

### Constructor Panel Features

Located at bottom of variant creation pages:
- **Download**: Generates PDF of variant
- **Print**: Opens browser print dialog
- **Save**: Saves variant to profile (POST /api/variants/save)
- **Share**: Generates shareable link and copies to clipboard

### State Management

Two Pinia stores handle app state:

**User Store** (`app/stores/user.ts`)
```javascript
const userStore = useUserStore()
await userStore.fetchUser()           // GET /api/auth/me
await userStore.fetchQuota()          // GET /api/variants/quota
userStore.user                        // Current user data
userStore.subscriptionExpiryFormatted // Formatted date
```

**Variants Store** (`app/stores/variants.ts`)
```javascript
const variantsStore = useVariantsStore()
await variantsStore.fetchSavedVariants()  // GET /api/variants/list
await variantsStore.saveVariant(variant)  // POST /api/variants/save
variantsStore.savedVariants               // All saved variants
```

### Testing Workflow

1. **Register** - Create account at `/auth/register` or click login modal
2. **Navigate** - Go to `/profile` to see dashboard
3. **Test Subscription** - Go to `/profile/subscription` and click "Activate Subscription"
4. **Create Variant** - Go to variant creator and generate a variant
5. **Save Variant** - Click "Save to Profile" button in action panel
6. **View Variants** - Check `/profile/my-variants` to see saved variants
7. **Test Payment** - Go to `/profile/payment-history` to see mock payments

### Environment Setup

Create `.env.local` file:
```
NUXT_API_BACKEND_URL=http://62.113.99.250:8000/api
NUXT_SESSION_PASSWORD=your-32-character-password-here
YOOKASSA_SHOP_ID=your-shop-id
YOOKASSA_SECRET_KEY=your-secret-key
```

### Project Structure

```
app/
├── pages/profile/
│   ├── index.vue              # Main profile with tabs
│   ├── my-variants.vue        # Saved variants list
│   ├── subscription.vue       # Subscription management
│   └── payment-history.vue    # Payment records
├── pages/variant/
│   └── [id].vue              # Shared variant viewer
├── components/
│   ├── profile/
│   │   ├── ProfileSidebar.vue # Navigation sidebar
│   │   └── VariantCard.vue    # Variant list item
│   ├── variant/
│   │   └── ActionPanel.vue    # Download/Print/Save/Share
├── stores/
│   ├── user.ts               # User state & auth
│   └── variants.ts           # Variants state management
└── composables/
    ├── useVariantExport.ts   # PDF/Print/Share logic
    └── useSubscriptionMock.ts # Subscription mock logic

server/api/
├── auth/                      # Auth endpoints
├── variants/                  # Variant endpoints
├── subscription/              # Subscription endpoints
└── payments/                  # Payment endpoints
```

### Common Tasks

**Fetch current user:**
```javascript
const userStore = useUserStore()
const user = await userStore.fetchUser()
```

**Get saved variants:**
```javascript
const variantsStore = useVariantsStore()
const variants = await variantsStore.fetchSavedVariants()
```

**Save a variant:**
```javascript
const variantsStore = useVariantsStore()
const savedVariant = await variantsStore.saveVariant(generatedVariant)
```

**Show toast notification:**
```javascript
const toast = useToast()
toast.add({
  title: 'Success',
  description: 'Operation completed',
  color: 'green'
})
```

### Troubleshooting

**Auth issues**: Clear browser localStorage and session cookies, then re-login
**API errors**: Check backend is running at NUXT_API_BACKEND_URL
**Build errors**: Run `npm install` and `npm run build` to verify
**PDF generation fails**: Ensure jspdf and html2canvas are installed

### Next Steps

1. Connect real backend API endpoints
2. Implement payment webhook handling
3. Add variant search and filtering
4. Create admin dashboard
5. Add email notifications
6. Implement variant versioning
