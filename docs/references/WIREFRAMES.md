# DineWithMe - Comprehensive Wireframes

**Three Platforms Visualized**

This document provides detailed ASCII wireframes for all three platforms in the DineWithMe application.

---

## Table of Contents

1. [Platform 1: Ops Admin](#platform-1-ops-admin)
2. [Platform 2: Restaurant Admin](#platform-2-restaurant-admin)
3. [Platform 3: Diner Front UI](#platform-3-diner-front-ui)
4. [Design System](#design-system)

---

## Platform 1: Ops Admin

**URL**: `/admin/ops/*`  
**Role**: PLATFORM_ADMIN only  
**Purpose**: System-wide oversight and restaurant approvals

### 1.1 Restaurant Management Page (`/admin/ops/restaurants`)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [☰ Sidebar]                    DineWithMe Ops Admin                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Restaurant Approvals                                                    │
│  Review and manage restaurant applications                               │
│                                                                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │
│  │ Pending Review  │  │     Active      │  │     Paused      │        │
│  │                 │  │                 │  │                 │        │
│  │      ⏳         │  │       ✅        │  │       ⏸️        │        │
│  │       3         │  │       12        │  │        2        │        │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘        │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ [All (17)] [Pending (3)] [Active (12)] [Paused (2)]            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Restaurant │ Owner          │ Location      │ Status  │ Actions │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │ 🍽️ Bella's │ john@email.com │ Cape Town     │ PENDING │ [✓][✗] │   │
│  │ Italian    │                │               │         │         │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │ 🍜 Sushi   │ jane@email.com │ Johannesburg  │ ACTIVE  │ [⏸️][✗]│   │
│  │ Palace     │                │               │         │         │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │ 🥘 Spice   │ mike@email.com │ Durban        │ PAUSED  │ [▶️][✗]│   │
│  │ Route      │                │               │         │         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```


### 1.2 Ops Admin Sidebar

```
┌──────────────────────┐
│   DineWithMe Ops     │
│                      │
│  👤 Admin Name       │
│  PLATFORM_ADMIN      │
│                      │
├──────────────────────┤
│                      │
│  📊 Dashboard        │
│  🏪 Restaurants   ✓  │
│  👥 Users            │
│  📈 Analytics        │
│  📋 Audit Logs       │
│                      │
├──────────────────────┤
│                      │
│  ⚙️  Settings        │
│  🚪 Sign Out         │
│                      │
└──────────────────────┘
```

### 1.3 Restaurant Detail Modal (Approval Flow)

```
┌─────────────────────────────────────────────────────────────┐
│  Restaurant Details                                    [✕]  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                       │   │
│  │              [Hero Image Preview]                    │   │
│  │                                                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  🍽️ Bella's Italian Kitchen                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                               │
│  📍 Location                                                 │
│     123 Main Street, Cape Town, 8001                         │
│                                                               │
│  🍴 Cuisine                                                  │
│     Italian                                                   │
│                                                               │
│  📝 Description                                              │
│     Authentic Italian cuisine in the heart of Cape Town.     │
│     Family-owned restaurant with 20 years of experience.     │
│                                                               │
│  👤 Owner                                                    │
│     John Smith (john@email.com)                              │
│     Member since: Jan 15, 2026                               │
│                                                               │
│  📊 Status                                                   │
│     PENDING REVIEW                                           │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                Gallery (3 images)                    │   │
│  │  [img1] [img2] [img3]                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  ✓ Approve       │  │  ✗ Reject        │                │
│  └──────────────────┘  └──────────────────┘                │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Platform 2: Restaurant Admin

**URL**: `/admin/restaurant/*` and `/admin/dinners/*`  
**Role**: RESTAURANT_ADMIN or PLATFORM_ADMIN  
**Purpose**: Restaurant owners manage their venue and dinners

### 2.1 Restaurant Profile Page (`/admin/restaurant`)

**Mode: Onboarding (No Restaurant Yet)**

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [☰ Sidebar]                    DineWithMe Admin                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│                              🍽️                                          │
│                                                                           │
│                    Welcome to DineWithMe                                 │
│                                                                           │
│         Let's set up your restaurant profile to start hosting            │
│                  amazing dining experiences                              │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Create Restaurant Profile                     │   │
│  │                                                                   │   │
│  │  Restaurant Name *                                               │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │ Enter restaurant name                                    │   │   │
│  │  └─────────────────────────────────────────────────────────┘   │   │
│  │                                                                   │   │
│  │  Description *                                                   │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │ Tell diners about your restaurant...                     │   │   │
│  │  │                                                           │   │   │
│  │  │                                                           │   │   │
│  │  └─────────────────────────────────────────────────────────┘   │   │
│  │                                                                   │   │
│  │  Cuisine Type *                                                  │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │ e.g., Italian, Japanese, Fusion                          │   │   │
│  │  └─────────────────────────────────────────────────────────┘   │   │
│  │                                                                   │   │
│  │  Address *                                                       │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │ Street address                                           │   │   │
│  │  └─────────────────────────────────────────────────────────┘   │   │
│  │                                                                   │   │
│  │  City *              Postal Code *                               │   │
│  │  ┌──────────────┐    ┌──────────────┐                          │   │
│  │  │ Cape Town    │    │ 8001         │                          │   │
│  │  └──────────────┘    └──────────────┘                          │   │
│  │                                                                   │   │
│  │  Contact Email *     Phone Number                                │   │
│  │  ┌──────────────┐    ┌──────────────┐                          │   │
│  │  │ contact@...  │    │ +27...       │                          │   │
│  │  └──────────────┘    └──────────────┘                          │   │
│  │                                                                   │   │
│  │                    ┌──────────────────┐                         │   │
│  │                    │ Create Profile   │                         │   │
│  │                    └──────────────────┘                         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```


**Mode: Edit (Restaurant Exists)**

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [☰ Sidebar]                    Restaurant Profile                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Restaurant Profile                                                      │
│  Manage your restaurant information and settings                         │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Basic Information                             │   │
│  │                                                                   │   │
│  │  Restaurant Name *                                               │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │ Bella's Italian Kitchen                                  │   │   │
│  │  └─────────────────────────────────────────────────────────┘   │   │
│  │                                                                   │   │
│  │  Description *                                                   │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │ Authentic Italian cuisine in the heart of Cape Town...   │   │   │
│  │  │                                                           │   │   │
│  │  └─────────────────────────────────────────────────────────┘   │   │
│  │                                                                   │   │
│  │  [Update Profile]                                                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      Table Themes                                │   │
│  │  Choose which types of dining experiences you'd like to host     │   │
│  │                                                                   │   │
│  │  ┌──────────────────────────────────────────────────────────┐  │   │
│  │  │ 🎭 First Impressions                            [✓ ON]   │  │   │
│  │  │ Break the ice with strangers over dinner                 │  │   │
│  │  └──────────────────────────────────────────────────────────┘  │   │
│  │                                                                   │   │
│  │  ┌──────────────────────────────────────────────────────────┐  │   │
│  │  │ 💼 Founder's Table                              [  OFF]  │  │   │
│  │  │ Connect with fellow entrepreneurs                        │  │   │
│  │  └──────────────────────────────────────────────────────────┘  │   │
│  │                                                                   │   │
│  │  ┌──────────────────────────────────────────────────────────┐  │   │
│  │  │ 🎨 Creative Minds                               [✓ ON]   │  │   │
│  │  │ Artists, designers, and creative professionals           │  │   │
│  │  └──────────────────────────────────────────────────────────┘  │   │
│  │                                                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                          Media                                   │   │
│  │  Upload images to showcase your restaurant                       │   │
│  │                                                                   │   │
│  │  Hero Image                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │                                                           │   │   │
│  │  │              [Current Hero Image]                        │   │   │
│  │  │                                                           │   │   │
│  │  └─────────────────────────────────────────────────────────┘   │   │
│  │  [📤 Upload New Hero Image]                                     │   │
│  │                                                                   │   │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │   │
│  │                                                                   │   │
│  │  Gallery                                                         │   │
│  │  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐                       │   │
│  │  │ [✕] │  │ [✕] │  │ [✕] │  │ [+]  │                       │   │
│  │  │ img1 │  │ img2 │  │ img3 │  │ Add  │                       │   │
│  │  └──────┘  └──────┘  └──────┘  └──────┘                       │   │
│  │                                                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Dinners Management Page (`/admin/dinners`)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [☰ Sidebar]                        Dinners                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Dinners                                      [+ Create Dinner]          │
│  Manage your upcoming and past dinner events                             │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ [All Dinners] [Upcoming] [Past]                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Date & Time    │ Theme           │ Seats      │ Status │ Actions│   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │ Mar 15, 2026   │ 🎭 First       │ 6/8 filled │ LIVE   │ [•••]  │   │
│  │ 7:00 PM        │ Impressions     │            │        │        │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │ Mar 20, 2026   │ 🎨 Creative    │ 0/10 filled│ SCHED  │ [•••]  │   │
│  │ 6:30 PM        │ Minds           │            │        │        │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │ Mar 25, 2026   │ 💼 Founder's   │ 4/6 filled │ SCHED  │ [•••]  │   │
│  │ 8:00 PM        │ Table           │            │        │        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  Actions Menu (•••):                                                     │
│  • View Details                                                          │
│  • Mark as Live                                                          │
│  • Mark as Completed                                                     │
│  • Cancel Dinner                                                         │
│  • View Attendees                                                        │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Create Dinner Page (`/admin/dinners/new`)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [☰ Sidebar]                    Create New Dinner                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Create New Dinner                                                       │
│  Schedule a new dining experience                                        │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Dinner Details                                │   │
│  │                                                                   │   │
│  │  Theme *                                                         │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │ Select a theme ▼                                         │   │   │
│  │  └─────────────────────────────────────────────────────────┘   │   │
│  │                                                                   │   │
│  │  Date *                                                          │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │ 📅 Select date                                           │   │   │
│  │  └─────────────────────────────────────────────────────────┘   │   │
│  │                                                                   │   │
│  │  Start Time *        End Time *                                  │   │
│  │  ┌──────────────┐    ┌──────────────┐                          │   │
│  │  │ 🕐 7:00 PM   │    │ 🕐 10:00 PM  │                          │   │
│  │  └──────────────┘    └──────────────┘                          │   │
│  │                                                                   │   │
│  │  Number of Seats *                                               │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │ 8                                                        │   │   │
│  │  └─────────────────────────────────────────────────────────┘   │   │
│  │                                                                   │   │
│  │  Description (Optional)                                          │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │ Add any special notes about this dinner...              │   │   │
│  │  │                                                           │   │   │
│  │  └─────────────────────────────────────────────────────────┘   │   │
│  │                                                                   │   │
│  │  ┌──────────────────┐  ┌──────────────────┐                    │   │
│  │  │ Create Dinner    │  │ Cancel           │                    │   │
│  │  └──────────────────┘  └──────────────────┘                    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.4 Restaurant Admin Sidebar

```
┌──────────────────────┐
│   DineWithMe Admin   │
│                      │
│  👤 Restaurant Name  │
│  RESTAURANT_ADMIN    │
│                      │
├──────────────────────┤
│                      │
│  🏪 Restaurant       │
│  🍽️  Dinners      ✓  │
│  📊 Analytics        │
│                      │
├──────────────────────┤
│                      │
│  ⚙️  Settings        │
│  🚪 Sign Out         │
│                      │
└──────────────────────┘
```


---

## Platform 3: Diner Front UI

**URL**: `/(core)/*`  
**Role**: Any authenticated user (DINER default)  
**Purpose**: Discover dinners, make reservations, provide feedback

### 3.1 Discover Page (`/discover`)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│  ← Discover                                                              │
│  Find your next dinner experience                                        │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 🔍 Search by city, theme, or date...                           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Filters:  [All Cities ▼]  [All Themes ▼]  [Any Date ▼]        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ ┌─────────────────────────────────────────────────────────┐    │   │
│  │ │                                                           │    │   │
│  │ │              [Restaurant Hero Image]                     │    │   │
│  │ │                                                           │    │   │
│  │ │  [First Impressions]                          [LIVE]     │    │   │
│  │ └─────────────────────────────────────────────────────────┘    │   │
│  │                                                                  │   │
│  │  Bella's Italian Kitchen • Italian                              │   │
│  │  Break the ice with strangers over authentic Italian cuisine    │   │
│  │                                                                  │   │
│  │  📅 Fri, Mar 15 • 7:00 PM - 10:00 PM                           │   │
│  │  📍 Cape Town                                                   │   │
│  │  👥 8 seats total                              2 seats left     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ ┌─────────────────────────────────────────────────────────┐    │   │
│  │ │                                                           │    │   │
│  │ │              [Restaurant Hero Image]                     │    │   │
│  │ │                                                           │    │   │
│  │ │  [Creative Minds]                                        │    │   │
│  │ └─────────────────────────────────────────────────────────┘    │   │
│  │                                                                  │   │
│  │  Sushi Palace • Japanese                                        │   │
│  │  Artists, designers, and creative professionals connect         │   │
│  │                                                                  │   │
│  │  📅 Wed, Mar 20 • 6:30 PM - 9:30 PM                            │   │
│  │  📍 Johannesburg                                                │   │
│  │  👥 10 seats total                            10 seats left     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ ┌─────────────────────────────────────────────────────────┐    │   │
│  │ │                                                           │    │   │
│  │ │              [Restaurant Hero Image]                     │    │   │
│  │ │                                                           │    │   │
│  │ │  [Founder's Table]                                       │    │   │
│  │ └─────────────────────────────────────────────────────────┘    │   │
│  │                                                                  │   │
│  │  Spice Route • Fusion                                           │   │
│  │  Connect with fellow entrepreneurs over innovative cuisine      │   │
│  │                                                                  │   │
│  │  📅 Mon, Mar 25 • 8:00 PM - 11:00 PM                           │   │
│  │  📍 Durban                                                      │   │
│  │  👥 6 seats total                                    Sold out   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
├─────────────────────────────────────────────────────────────────────────┤
│  [🔍 Discover]  [🍽️ My Dinners]  [🤝 Connections]  [👤 Profile]       │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Dinner Detail Page (`/dinner/[id]`)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ← Back                                                                  │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                   │   │
│  │                                                                   │   │
│  │              [Restaurant Hero Image]                             │   │
│  │                                                                   │   │
│  │                                                                   │   │
│  │  [First Impressions]                              [LIVE]         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  🎭 First Impressions                                                    │
│  Bella's Italian Kitchen • Italian                                       │
│                                                                           │
│  Break the ice with strangers over dinner. This theme is perfect for     │
│  those looking to expand their social circle and meet new people in a    │
│  comfortable, structured setting.                                        │
│                                                                           │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                                           │
│  📅 Date & Time                                                          │
│  Friday, March 15, 2026                                                  │
│  7:00 PM - 10:00 PM                                                      │
│                                                                           │
│  📍 Location                                                             │
│  123 Main Street, Cape Town, 8001                                        │
│                                                                           │
│  👥 Availability                                                         │
│  2 of 8 seats available                                                  │
│                                                                           │
│  💰 Commitment                                                           │
│  R75.00 (Refundable if cancelled 24h+ before dinner)                    │
│                                                                           │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                                           │
│  What to Expect                                                          │
│                                                                           │
│  🎯 Conversation Starters                                                │
│  • What's the most interesting thing that happened to you this week?     │
│  • If you could have dinner with anyone, who would it be?               │
│  • What's a skill you'd love to learn?                                  │
│                                                                           │
│  ✨ Experience                                                           │
│  • Intimate group setting (8 people max)                                │
│  • Structured ice-breaker activities                                    │
│  • Authentic Italian 3-course meal                                      │
│  • 3-hour experience                                                    │
│                                                                           │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                                           │
│  About the Restaurant                                                    │
│                                                                           │
│  Authentic Italian cuisine in the heart of Cape Town. Family-owned       │
│  restaurant with 20 years of experience bringing traditional Italian     │
│  flavors to South Africa.                                                │
│                                                                           │
│                                                                           │
│                                                                           │
│                                                                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌───────────────────────────────────────────────────────────────┐     │
│  │              Reserve Your Seat • R75.00                        │     │
│  └───────────────────────────────────────────────────────────────┘     │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```


### 3.3 Seat Selection UI (Pending Implementation)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ← Back to Dinner                                                        │
│                                                                           │
│  Select Your Seat                                                        │
│  First Impressions • Bella's Italian Kitchen                             │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                   │   │
│  │                    Table Layout                                  │   │
│  │                                                                   │   │
│  │              ┌───┐  ┌───┐  ┌───┐                               │   │
│  │              │ 1 │  │ 2 │  │ 3 │                               │   │
│  │              └───┘  └───┘  └───┘                               │   │
│  │                                                                   │   │
│  │         ┌─────────────────────────────┐                         │   │
│  │         │                             │                         │   │
│  │         │          TABLE              │                         │   │
│  │         │                             │                         │   │
│  │         └─────────────────────────────┘                         │   │
│  │                                                                   │   │
│  │              ┌───┐  ┌───┐  ┌───┐                               │   │
│  │              │ 4 │  │ 5 │  │ 6 │                               │   │
│  │              └───┘  └───┘  └───┘                               │   │
│  │                                                                   │   │
│  │  Legend:                                                         │   │
│  │  ┌───┐ Available    ┌───┐ Selected    ┌───┐ Taken             │   │
│  │  │   │              │ ✓ │              │ ✗ │                   │   │
│  │  └───┘              └───┘              └───┘                   │   │
│  │                                                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  Selected: Seat 3                                                        │
│                                                                           │
│  ⏱️  This seat will be held for 10 minutes                               │
│                                                                           │
│  ┌───────────────────────────────────────────────────────────────┐     │
│  │              Confirm Selection • R75.00                        │     │
│  └───────────────────────────────────────────────────────────────┘     │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.4 Payment Flow (Pending Implementation)

**Step 1: Seat Held**

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ✓ Seat Reserved                                                         │
│                                                                           │
│  Your seat has been held for 10 minutes                                  │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                   │   │
│  │  ⏱️  Time Remaining: 09:45                                       │   │
│  │                                                                   │   │
│  │  Dinner Details                                                  │   │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │   │
│  │                                                                   │   │
│  │  🎭 First Impressions                                            │   │
│  │  Bella's Italian Kitchen                                         │   │
│  │                                                                   │   │
│  │  📅 Friday, March 15, 2026                                       │   │
│  │  🕐 7:00 PM - 10:00 PM                                           │   │
│  │  📍 Cape Town                                                    │   │
│  │  💺 Seat 3                                                       │   │
│  │                                                                   │   │
│  │  Payment Summary                                                 │   │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │   │
│  │                                                                   │   │
│  │  Commitment Fee                                      R75.00      │   │
│  │  Processing Fee                                       R2.50      │   │
│  │                                                      ──────      │   │
│  │  Total                                               R77.50      │   │
│  │                                                                   │   │
│  │  ℹ️  Refundable if cancelled 24+ hours before dinner            │   │
│  │                                                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌───────────────────────────────────────────────────────────────┐     │
│  │              Proceed to Payment                                │     │
│  └───────────────────────────────────────────────────────────────┘     │
│                                                                           │
│  [Cancel Reservation]                                                    │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

**Step 2: Payment Success**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│                              ✓                                           │
│                                                                           │
│                    Booking Confirmed!                                    │
│                                                                           │
│  Your seat has been confirmed and you're all set for dinner.             │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                   │   │
│  │  Booking Details                                                 │   │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │   │
│  │                                                                   │   │
│  │  🎭 First Impressions                                            │   │
│  │  Bella's Italian Kitchen                                         │   │
│  │                                                                   │   │
│  │  📅 Friday, March 15, 2026                                       │   │
│  │  🕐 7:00 PM - 10:00 PM                                           │   │
│  │  📍 123 Main Street, Cape Town, 8001                             │   │
│  │  💺 Seat 3                                                       │   │
│  │                                                                   │   │
│  │  Booking Reference: #DWM-12345                                   │   │
│  │                                                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  What's Next?                                                            │
│                                                                           │
│  ✓ Confirmation email sent                                               │
│  ✓ Calendar invite attached                                              │
│  • Check in when you arrive (QR code in email)                           │
│  • Enjoy your dinner!                                                    │
│  • Share feedback after the experience                                   │
│                                                                           │
│  ┌───────────────────────────────────────────────────────────────┐     │
│  │              View My Dinners                                   │     │
│  └───────────────────────────────────────────────────────────────┘     │
│                                                                           │
│  [← Back to Discover]                                                    │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.5 My Dinners Page (`/my-dinners`)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│  ← My Dinners                                                            │
│  View and manage your reservations                                       │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ [Upcoming] [Past]                                                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                   │   │
│  │  🎭 First Impressions                          [Confirmed]       │   │
│  │  Bella's Italian Kitchen • Italian                               │   │
│  │                                                                   │   │
│  │  📅 Fri, Mar 15, 2026                                            │   │
│  │  👥 7:00 PM - 10:00 PM                                           │   │
│  │  📍 Cape Town                                                    │   │
│  │                                                                   │   │
│  │  ℹ️  Remember to check in when you arrive                        │   │
│  │                                                                   │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │  ✗ Cancel Booking                                        │   │   │
│  │  └─────────────────────────────────────────────────────────┘   │   │
│  │                                                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                   │   │
│  │  🎨 Creative Minds                             [Confirmed]       │   │
│  │  Sushi Palace • Japanese                                         │   │
│  │                                                                   │   │
│  │  📅 Wed, Mar 20, 2026                                            │   │
│  │  👥 6:30 PM - 9:30 PM                                            │   │
│  │  📍 Johannesburg                                                 │   │
│  │                                                                   │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │  ✗ Cancel Booking                                        │   │   │
│  │  └─────────────────────────────────────────────────────────┘   │   │
│  │                                                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  [Past Tab View]                                                         │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                   │   │
│  │  💼 Founder's Table                            [Completed]       │   │
│  │  Spice Route • Fusion                                            │   │
│  │                                                                   │   │
│  │  📅 Mon, Feb 25, 2026                                            │   │
│  │  👥 8:00 PM - 11:00 PM                                           │   │
│  │  📍 Durban                                                       │   │
│  │                                                                   │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │  💬 Leave Feedback                                       │   │   │
│  │  └─────────────────────────────────────────────────────────┘   │   │
│  │                                                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
├─────────────────────────────────────────────────────────────────────────┤
│  [🔍 Discover]  [🍽️ My Dinners]  [🤝 Connections]  [👤 Profile]       │
└─────────────────────────────────────────────────────────────────────────┘
```


### 3.6 Post-Dinner Feedback Flow (`/dinner/[id]/post-dinner`)

**Step 1: Overall Sentiment**

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ← Back                                                                  │
│                                                                           │
│  Share Your Experience                                                   │
│  First Impressions • Bella's Italian Kitchen                             │
│                                                                           │
│  Step 1 of 4                                                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                                           │
│  How was your overall experience?                                        │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                   │   │
│  │                          😊                                      │   │
│  │                       Positive                                   │   │
│  │                                                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                   │   │
│  │                          😐                                      │   │
│  │                       Neutral                                    │   │
│  │                                                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                   │   │
│  │                          😞                                      │   │
│  │                       Negative                                   │   │
│  │                                                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│                                                                           │
│                                                                           │
│                                                                           │
│                                                                           │
│                                                                           │
│                                                                           │
│                                                                           │
│                                                                           │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

**Step 2: Comfort Level**

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ← Back                                                                  │
│                                                                           │
│  Share Your Experience                                                   │
│  First Impressions • Bella's Italian Kitchen                             │
│                                                                           │
│  Step 2 of 4                                                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                                           │
│  How comfortable did you feel?                                           │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                   │   │
│  │                    Very Comfortable                              │   │
│  │  I felt completely at ease and enjoyed the atmosphere            │   │
│  │                                                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                   │   │
│  │                    Somewhat Comfortable                          │   │
│  │  I was mostly comfortable with minor awkward moments             │   │
│  │                                                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                   │   │
│  │                    Neutral                                       │   │
│  │  Neither comfortable nor uncomfortable                           │   │
│  │                                                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                   │   │
│  │                    Uncomfortable                                 │   │
│  │  I felt uneasy or out of place                                   │   │
│  │                                                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

**Step 3: Person Signals**

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ← Back                                                                  │
│                                                                           │
│  Share Your Experience                                                   │
│  First Impressions • Bella's Italian Kitchen                             │
│                                                                           │
│  Step 3 of 4                                                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                                           │
│  Who would you like to connect with?                                     │
│  Select people you'd be interested in staying in touch with              │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                   │   │
│  │  👤 Sarah Johnson                                    [❤️]        │   │
│  │  Seat 2                                                          │   │
│  │                                                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                   │   │
│  │  👤 Michael Chen                                     [  ]        │   │
│  │  Seat 4                                                          │   │
│  │                                                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                   │   │
│  │  👤 Emma Williams                                    [❤️]        │   │
│  │  Seat 5                                                          │   │
│  │                                                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                   │   │
│  │  👤 David Brown                                      [  ]        │   │
│  │  Seat 6                                                          │   │
│  │                                                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ℹ️  If they also select you, we'll share contact information            │
│                                                                           │
│  ┌───────────────────────────────────────────────────────────────┐     │
│  │              Continue                                          │     │
│  └───────────────────────────────────────────────────────────────┘     │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

**Step 4: Completion**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│                              ✓                                           │
│                                                                           │
│                    Thank You!                                            │
│                                                                           │
│  Your feedback helps us create better dining experiences                 │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                   │   │
│  │  What Happens Next?                                              │   │
│  │                                                                   │   │
│  │  ✓ Your feedback has been recorded                               │   │
│  │  ✓ Trust score updated                                           │   │
│  │  • We'll notify you if there are mutual connections              │   │
│  │  • Check your Connections page in 24 hours                       │   │
│  │                                                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌───────────────────────────────────────────────────────────────┐     │
│  │              View My Connections                               │     │
│  └───────────────────────────────────────────────────────────────┘     │
│                                                                           │
│  [← Back to My Dinners]                                                  │
│                                                                           │
│                                                                           │
│                                                                           │
│                                                                           │
│                                                                           │
│                                                                           │
│                                                                           │
│                                                                           │
│                                                                           │
│                                                                           │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.7 Connections Page (`/connections`)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│  ← Connections                                                           │
│  People you've connected with                                            │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                   │   │
│  │  👤 Sarah Johnson                                                │   │
│  │  sarah.j@email.com                                               │   │
│  │                                                                   │   │
│  │  Connected at: First Impressions                                 │   │
│  │  Bella's Italian Kitchen • Feb 25, 2026                          │   │
│  │                                                                   │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │  📧 Send Message                                         │   │   │
│  │  └─────────────────────────────────────────────────────────┘   │   │
│  │                                                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                   │   │
│  │  👤 Emma Williams                                                │   │
│  │  emma.w@email.com                                                │   │
│  │                                                                   │   │
│  │  Connected at: First Impressions                                 │   │
│  │  Bella's Italian Kitchen • Feb 25, 2026                          │   │
│  │                                                                   │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │  📧 Send Message                                         │   │   │
│  │  └─────────────────────────────────────────────────────────┘   │   │
│  │                                                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                   │   │
│  │  👤 Michael Chen                                                 │   │
│  │  m.chen@email.com                                                │   │
│  │                                                                   │   │
│  │  Connected at: Creative Minds                                    │   │
│  │  Sushi Palace • Jan 15, 2026                                     │   │
│  │                                                                   │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │  📧 Send Message                                         │   │   │
│  │  └─────────────────────────────────────────────────────────┘   │   │
│  │                                                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
├─────────────────────────────────────────────────────────────────────────┤
│  [🔍 Discover]  [🍽️ My Dinners]  [🤝 Connections]  [👤 Profile]       │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.8 Profile Page (`/profile`)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│  ← Profile                                                               │
│  Your account information                                                │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                   │   │
│  │                          👤                                      │   │
│  │                                                                   │   │
│  │                    John Smith                                    │   │
│  │                  john@email.com                                  │   │
│  │                                                                   │   │
│  │                  [DINER]                                         │   │
│  │                                                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                   │   │
│  │  Trust Score                                                     │   │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │   │
│  │                                                                   │   │
│  │                          85                                      │   │
│  │                                                                   │   │
│  │  ⭐⭐⭐⭐⭐                                                        │   │
│  │                                                                   │   │
│  │  Based on 5 dinners attended                                     │   │
│  │                                                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                   │   │
│  │  Activity                                                        │   │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │   │
│  │                                                                   │   │
│  │  🍽️  Dinners Attended: 5                                        │   │
│  │  🤝 Connections Made: 8                                          │   │
│  │  📅 Member Since: Jan 2026                                       │   │
│  │                                                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  ⚙️  Account Settings                                            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  🚪 Sign Out                                                     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
├─────────────────────────────────────────────────────────────────────────┤
│  [🔍 Discover]  [🍽️ My Dinners]  [🤝 Connections]  [👤 Profile]       │
└─────────────────────────────────────────────────────────────────────────┘
```


---

## Design System

### Color Palette

```
Primary Colors:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Slate 900  ████  #0f172a  Primary text, buttons
Slate 800  ████  #1e293b  Hover states
Slate 700  ████  #334155  Secondary text
Slate 600  ████  #475569  Tertiary text
Slate 500  ████  #64748b  Disabled text
Slate 400  ████  #94a3b8  Placeholder text
Slate 300  ████  #cbd5e1  Borders
Slate 200  ████  #e2e8f0  Dividers
Slate 100  ████  #f1f5f9  Backgrounds
Slate 50   ████  #f8fafc  Subtle backgrounds

Accent Colors:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Green 600  ████  #16a34a  Success, confirmed
Green 50   ████  #f0fdf4  Success background

Blue 600   ████  #2563eb  Info, links
Blue 50    ████  #eff6ff  Info background

Yellow 600 ████  #ca8a04  Warning, limited seats
Yellow 50  ████  #fefce8  Warning background

Red 600    ████  #dc2626  Error, cancel, danger
Red 50     ████  #fef2f2  Error background

Gray 50    ████  #f9fafb  Neutral background
Gray 100   ████  #f3f4f6  Card background
```

### Typography

```
Font Family: System UI Stack
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, 
"Helvetica Neue", Arial, sans-serif

Headings:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

H1: 3xl (30px)  font-semibold  text-slate-900
H2: 2xl (24px)  font-semibold  text-slate-900
H3: xl  (20px)  font-semibold  text-slate-900
H4: lg  (18px)  font-medium   text-slate-900

Body Text:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Body:    base (16px)  font-normal  text-slate-700
Small:   sm   (14px)  font-normal  text-slate-600
Tiny:    xs   (12px)  font-normal  text-slate-500
```

### Spacing

```
8-Unit Grid System:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

0.5  =  4px   (0.125rem)
1    =  8px   (0.25rem)
2    =  16px  (0.5rem)
3    =  24px  (0.75rem)
4    =  32px  (1rem)
6    =  48px  (1.5rem)
8    =  64px  (2rem)
12   =  96px  (3rem)
16   =  128px (4rem)
```

### Border Radius

```
Rounded Corners:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

rounded-lg   = 8px   (0.5rem)   Buttons, inputs
rounded-xl   = 12px  (0.75rem)  Cards, containers
rounded-2xl  = 16px  (1rem)     Hero images, modals
rounded-full = 9999px            Badges, avatars
```

### Shadows

```
Elevation:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

shadow-sm   = Subtle borders
shadow      = Cards at rest
shadow-md   = Cards on hover
shadow-lg   = Modals, dropdowns
shadow-xl   = Floating elements
```

### Components

```
Buttons:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Primary:
┌──────────────────┐
│  Button Text     │  bg-slate-900 text-white
└──────────────────┘  hover:bg-slate-800

Secondary:
┌──────────────────┐
│  Button Text     │  bg-white text-slate-900 border-slate-200
└──────────────────┘  hover:bg-slate-50

Danger:
┌──────────────────┐
│  Button Text     │  bg-white text-red-600 border-red-200
└──────────────────┘  hover:bg-red-50

Cards:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────────────────────┐
│                                     │  bg-white
│  Card Content                       │  border-slate-200
│                                     │  rounded-xl
└─────────────────────────────────────┘  shadow

Inputs:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────────────────────┐
│ Placeholder text                    │  bg-white
└─────────────────────────────────────┘  border-slate-300
                                         rounded-lg
                                         focus:border-slate-900

Badges:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Status]  rounded-full px-3 py-1 text-xs font-medium

Success:  bg-green-50 text-green-700
Info:     bg-blue-50 text-blue-700
Warning:  bg-yellow-50 text-yellow-700
Error:    bg-red-50 text-red-700
Neutral:  bg-gray-50 text-gray-700
```

### Icons

```
Icon Library: Lucide React
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Common Icons:
• Calendar      📅  Date/time
• MapPin        📍  Location
• Users         👥  People/seats
• Clock         🕐  Time
• XCircle       ✗   Cancel/close
• CheckCircle   ✓   Success/confirm
• MessageSquare 💬  Feedback/messages
• Settings      ⚙️   Settings
• LogOut        🚪  Sign out
• Search        🔍  Search
• Filter        🔽  Filters
• MoreVertical  •••  Actions menu

Sizes:
• h-4 w-4  (16px)  Small icons in text
• h-5 w-5  (20px)  Medium icons
• h-6 w-6  (24px)  Large icons
• h-12 w-12 (48px) Hero icons
```

### Responsive Breakpoints

```
Mobile First Approach:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Default:  < 640px   Mobile (base styles)
sm:       ≥ 640px   Small tablets
md:       ≥ 768px   Tablets
lg:       ≥ 1024px  Laptops
xl:       ≥ 1280px  Desktops
2xl:      ≥ 1536px  Large desktops

Max Width Containers:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Diner UI:     max-w-lg  (512px)  Mobile-first, centered
Admin UI:     max-w-7xl (1280px) Full-width desktop
```

### Transitions

```
Animation Timing:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

transition-colors    Color changes (150ms)
transition-all       All properties (150ms)
active:scale-[0.98]  Button press feedback
hover:shadow-md      Elevation on hover
```

### Accessibility

```
WCAG 2.1 AA Compliance:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Color contrast ratios ≥ 4.5:1 for normal text
✓ Color contrast ratios ≥ 3:1 for large text
✓ Focus indicators on all interactive elements
✓ Semantic HTML (headings, landmarks, lists)
✓ Alt text for all images
✓ Keyboard navigation support
✓ Screen reader friendly labels
✓ Touch targets ≥ 44x44px
```

---

## Navigation Patterns

### Ops Admin Navigation

```
Desktop Sidebar (Always Visible):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌──────────────────────┐
│   DineWithMe Ops     │
│                      │
│  👤 Admin Name       │
│  PLATFORM_ADMIN      │
│                      │
├──────────────────────┤
│                      │
│  📊 Dashboard        │
│  🏪 Restaurants   ✓  │  ← Active page
│  👥 Users            │
│  📈 Analytics        │
│  📋 Audit Logs       │
│                      │
├──────────────────────┤
│                      │
│  ⚙️  Settings        │
│  🚪 Sign Out         │
│                      │
└──────────────────────┘

Mobile: Hamburger menu (☰) with slide-out drawer
```

### Restaurant Admin Navigation

```
Desktop Sidebar (Always Visible):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌──────────────────────┐
│   DineWithMe Admin   │
│                      │
│  👤 Restaurant Name  │
│  RESTAURANT_ADMIN    │
│                      │
├──────────────────────┤
│                      │
│  🏪 Restaurant       │
│  🍽️  Dinners      ✓  │  ← Active page
│  📊 Analytics        │
│                      │
├──────────────────────┤
│                      │
│  ⚙️  Settings        │
│  🚪 Sign Out         │
│                      │
└──────────────────────┘

Mobile: Hamburger menu (☰) with slide-out drawer
```

### Diner UI Navigation

```
Mobile Bottom Navigation (Always Visible):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────────────────────────────────────────────────┐
│  [🔍 Discover]  [🍽️ My Dinners]  [🤝 Connections]  [👤 Profile] │
│       ✓                                                          │
└─────────────────────────────────────────────────────────────────┘

Active state: Bold text + indicator line
Fixed position at bottom of screen
Safe area padding for iOS devices
```

---

## User Flows

### Flow 1: Restaurant Owner Onboarding

```
1. Sign Up
   ↓
2. Assigned DINER role (default)
   ↓
3. Navigate to /admin/restaurant
   ↓
4. See onboarding screen
   ↓
5. Fill restaurant profile form
   ↓
6. Submit for review
   ↓
7. Status: PENDING
   ↓
8. Platform admin reviews
   ↓
9. Status: ACTIVE
   ↓
10. Upload hero image & gallery
    ↓
11. Enable themes
    ↓
12. Create first dinner
    ↓
13. Monitor bookings
```

### Flow 2: Diner Booking Journey

```
1. Browse /discover
   ↓
2. Filter by city/theme/date
   ↓
3. Click dinner card
   ↓
4. View dinner details
   ↓
5. Click "Reserve Your Seat"
   ↓
6. [PENDING] Select seat visually
   ↓
7. Seat held for 10 minutes
   ↓
8. [PENDING] Click "Proceed to Payment"
   ↓
9. Redirect to Paystack
   ↓
10. Complete payment
    ↓
11. Webhook confirms seat
    ↓
12. Confirmation page
    ↓
13. Email with QR code sent
    ↓
14. View in /my-dinners
```

### Flow 3: Post-Dinner Feedback

```
1. Attend dinner
   ↓
2. Check in with QR code
   ↓
3. After dinner ends
   ↓
4. Navigate to /my-dinners
   ↓
5. Click "Leave Feedback"
   ↓
6. Step 1: Overall sentiment
   ↓
7. Step 2: Comfort level
   ↓
8. Step 3: Select people to connect with
   ↓
9. Step 4: Safety flags (if needed)
   ↓
10. Submit feedback
    ↓
11. Trust score updated
    ↓
12. Mutual interests detected
    ↓
13. View connections in /connections
```

---

## Key Interactions

### Hover States

```
Cards:
  Rest:   shadow
  Hover:  shadow-md + slight scale

Buttons:
  Rest:   bg-slate-900
  Hover:  bg-slate-800
  Active: scale-[0.98]

Links:
  Rest:   text-slate-600
  Hover:  text-slate-900
```

### Loading States

```
Skeleton Screens:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  Animated shimmer
│                                     │  bg-slate-200
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  animate-pulse
│                                     │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
└─────────────────────────────────────┘
```

### Empty States

```
No Data:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────────────────────┐
│                                     │
│              🍽️                     │  Large emoji
│                                     │
│        No dinners yet               │  Heading
│                                     │
│  Create your first dining           │  Description
│  experience to get started          │
│                                     │
│     [+ Create Dinner]               │  CTA button
│                                     │
└─────────────────────────────────────┘
```

### Error States

```
Error Message:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────────────────────┐
│  ⚠️  Something went wrong           │  bg-red-50
│                                     │  text-red-700
│  Please try again or contact        │  border-red-200
│  support if the problem persists.   │
│                                     │
│     [Try Again]                     │
└─────────────────────────────────────┘
```

---

## Summary

This wireframe document provides a comprehensive visual guide for all three platforms in the DineWithMe application:

1. **Ops Admin** - System oversight with restaurant approvals and user management
2. **Restaurant Admin** - Venue management with profile editing, theme selection, and dinner scheduling
3. **Diner Front UI** - Discovery, booking, feedback, and connections

All platforms follow a consistent Apple-native design system with:
- Slate color palette
- 8-unit grid spacing
- Rounded corners (rounded-xl)
- Smooth transitions
- Mobile-first responsive design
- WCAG 2.1 AA accessibility compliance

The wireframes show both implemented features (✅) and pending UI components (⚠️) like seat selection and payment flow.

---

**Document Version**: 1.0  
**Last Updated**: March 3, 2026  
**Status**: Complete and Ready for Development Reference
