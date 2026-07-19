# Architecture Breakdown: Three Platforms, One Database

## Executive Summary

Yes, all three platforms share the same PostgreSQL database. This is a **multi-tenant, role-based architecture** where a single codebase and database serve three distinct user experiences based on user roles.

---

## The Three Platforms

### 1. Diner Frontend (Consumer App)
- **Route:** `/discover`, `/my-dinners`, `/dinner/[id]`, `/profile`
- **Role:** `DINER` (default)
- **Purpose:** Browse dinners, book seats, check-in, provide feedback
- **Access:** Any authenticated user

### 2. Restaurant Admin
- **Route:** `/admin/restaurant`, `/admin/dinners`
- **Role:** `RESTAURANT_ADMIN`
- **Purpose:** Manage restaurant profile, create/manage dinners, view bookings
- **Access:** Users with `RESTAURANT_ADMIN` role + restaurant membership

### 3. Platform Operations (Ops Admin)
- **Route:** `/admin/ops`
- **Role:** `PLATFORM_ADMIN`
- **Purpose:** Approve restaurants, manage platform settings, oversee all operations
- **Access:** Users with `PLATFORM_ADMIN` role only

---

## Shared Architecture Components

### 1. Single Database (PostgreSQL)
```
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                      │
│                                                             │
│  ┌──────────┐  ┌────────────┐  ┌────────┐  ┌──────────┐  │
│  │  Users   │  │Restaurants │  │Dinners │  │  Seats   │  │
│  │          │  │            │  │        │  │          │  │
│  │ role:    │  │ status:    │  │        │  │ status:  │  │
│  │ - DINER  │  │ - PENDING  │  │        │  │ - HELD   │  │
│  │ - REST.. │  │ - ACTIVE   │  │        │  │ - CONF.. │  │
│  │ - PLAT.. │  │ - PAUSED   │  │        │  │          │  │
│  └──────────┘  └────────────┘  └────────┘  └──────────┘  │
│                                                             │
│  ┌──────────┐  ┌────────────┐  ┌────────┐  ┌──────────┐  │
│  │Feedback  │  │TrustEvents │  │Payments│  │AuditLogs │  │
│  └──────────┘  └────────────┘  └────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │
                            │ Single DATABASE_URL
                            │
┌───────────────────────────┴─────────────────────────────────┐
│                    Next.js Application                      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              Shared Packages Layer                   │  │
│  │                                                       │  │
│  │  @dinewithme/db         - Database repositories     │  │
│  │  @dinewithme/shared     - Schemas & types           │  │
│  │  @dinewithme/config     - Environment config        │  │
│  │  @dinewithme/payment    - Payment integration       │  │
│  │  @dinewithme/storage    - File storage (R2)         │  │
│  │  @dinewithme/analytics  - Event tracking            │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              Authentication Layer                    │  │
│  │                                                       │  │
│  │  Clerk (External)  →  Database Sync  →  Role Check  │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              Route-Based Separation                  │  │
│  │                                                       │  │
│  │  /discover          →  Diner Frontend               │  │
│  │  /admin/restaurant  →  Restaurant Admin             │  │
│  │  /admin/ops         →  Platform Ops                 │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2. Single Codebase (Monorepo)
```
apps/
  web/                    # Single Next.js application
    src/
      app/
        (core)/          # Diner routes
        admin/
          restaurant/    # Restaurant admin routes
          dinners/       # Restaurant admin routes
          ops/           # Platform ops routes
        api/             # Shared API endpoints

packages/
  db/                    # Shared database layer
  shared/                # Shared types & schemas
  config/                # Shared configuration
  payment/               # Shared payment logic
  storage/               # Shared file storage
  analytics/             # Shared analytics
```

### 3. Single Authentication Provider (Clerk)
- All users authenticate through Clerk
- User records synced to local database
- Role assigned in database: `DINER`, `RESTAURANT_ADMIN`, `PLATFORM_ADMIN`
- Single session works across all three platforms

### 4. Shared Business Logic
- Same repositories for data access
- Same validation schemas
- Same state machines (seat lifecycle)
- Same payment processing
- Same trust scoring system

---

## How Role-Based Separation Works

### Authentication & Authorization Flow

```
User Signs In
     ↓
Clerk Authenticates
     ↓
Database Sync (/api/auth/sync)
     ↓
User Record Created/Updated
     ↓
Role Assigned (DINER by default)
     ↓
┌────────────────────────────────────────┐
│         Middleware Protection          │
│                                        │
│  1. Check if authenticated             │
│  2. Allow access to route              │
│  3. Layout checks role                 │
└────────────────────────────────────────┘
     ↓
┌────────────────────────────────────────┐
│         Layout-Level Protection        │
│                                        │
│  /admin/ops/layout.tsx                 │
│    → Requires PLATFORM_ADMIN           │
│    → Redirects others to /unauthorized │
│                                        │
│  /admin/restaurant/page.tsx            │
│    → Requires RESTAURANT_ADMIN         │
│    → Checks restaurant membership      │
│                                        │
│  /(core)/discover/page.tsx             │
│    → Any authenticated user            │
└────────────────────────────────────────┘
     ↓
┌────────────────────────────────────────┐
│         API-Level Protection           │
│                                        │
│  requireAuth()                         │
│    → Verifies authentication           │
│                                        │
│  requireRole([Role.PLATFORM_ADMIN])    │
│    → Verifies specific role            │
│                                        │
│  Business logic checks                 │
│    → Restaurant ownership              │
│    → Resource access permissions       │
└────────────────────────────────────────┘
```

### Data Isolation Through Business Logic

While all data is in one database, access is controlled through:

1. **Role-based queries:**
```typescript
// Restaurant admin sees only their restaurants
const restaurants = await restaurantRepository.findManyForUser(userId);

// Platform admin sees all restaurants
const allRestaurants = await restaurantRepository.findAll();
```

2. **Relationship-based access:**
```typescript
// Check if user is member of restaurant
const member = await RestaurantMember.findUnique({
  where: { restaurantId_userId: { restaurantId, userId } }
});
```

3. **Status-based filtering:**
```typescript
// Diners see only ACTIVE restaurants
const activeRestaurants = await restaurantRepository.findActive();

// Platform admin sees PENDING restaurants for approval
const pendingRestaurants = await restaurantRepository.findByStatus('PENDING');
```

---

## Risks & Challenges

### 1. Security Risks

#### Risk: Role Escalation
- **Threat:** User modifies their role in database or bypasses checks
- **Mitigation:**
  - Role checks at multiple layers (middleware, layout, API, business logic)
  - Audit logging for all role changes
  - No client-side role assignment
  - Database constraints prevent invalid roles

#### Risk: Cross-Tenant Data Leakage
- **Threat:** Restaurant admin accesses another restaurant's data
- **Mitigation:**
  - All queries filtered by user/restaurant relationship
  - Repository pattern enforces access control
  - No direct database queries in UI code
  - Audit logging tracks all data access

#### Risk: Privilege Confusion
- **Threat:** User with multiple roles gets confused permissions
- **Mitigation:**
  - Single role per user (no role stacking)
  - Clear UI separation by route
  - Explicit role checks in every protected area

### 2. Performance Risks

#### Risk: Database Contention
- **Threat:** All platforms hitting same database causes bottlenecks
- **Mitigation:**
  - Database indexes on frequently queried columns
  - Connection pooling (Prisma default)
  - Query optimization in repositories
  - Caching strategy (Next.js automatic caching)

#### Risk: Slow Queries Affect All Users
- **Threat:** Heavy ops admin query slows down diner experience
- **Mitigation:**
  - Separate read replicas (future)
  - Query timeouts
  - Pagination on large datasets
  - Background jobs for heavy operations

### 3. Operational Risks

#### Risk: Single Point of Failure
- **Threat:** Database down = all platforms down
- **Mitigation:**
  - Database replication (production)
  - Automated backups
  - Health checks and monitoring
  - Graceful degradation where possible

#### Risk: Schema Changes Break Multiple Platforms
- **Threat:** Migration affects all three platforms simultaneously
- **Mitigation:**
  - Comprehensive testing before migrations
  - Backward-compatible changes
  - Feature flags for gradual rollout
  - Rollback procedures

### 4. Development Risks

#### Risk: Code Coupling
- **Threat:** Changes for one platform break another
- **Mitigation:**
  - Shared packages for common logic
  - Clear separation of concerns
  - Comprehensive test coverage
  - Type safety with TypeScript

---

## Measures Put in Place

### 1. Multi-Layer Security

```
┌─────────────────────────────────────────┐
│         Layer 1: Middleware             │
│  - Route-level authentication           │
│  - Redirects unauthenticated users      │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│         Layer 2: Layout Guards          │
│  - Role verification                    │
│  - Restaurant membership checks         │
│  - Redirect unauthorized users          │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│         Layer 3: API Protection         │
│  - requireAuth() for authentication     │
│  - requireRole() for authorization      │
│  - Request ID tracking                  │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│         Layer 4: Business Logic         │
│  - Repository-level filtering           │
│  - Relationship validation              │
│  - Resource ownership checks            │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│         Layer 5: Database               │
│  - Foreign key constraints              │
│  - Enum constraints                     │
│  - Unique constraints                   │
│  - Cascade deletes                      │
└─────────────────────────────────────────┘
```

### 2. Audit Trail
```typescript
// Every sensitive action is logged
await auditLogger.log({
  actorUserId: user.id,
  actionType: 'RESTAURANT_APPROVED',
  entityType: 'Restaurant',
  entityId: restaurant.id,
  metadata: { previousStatus: 'PENDING', newStatus: 'ACTIVE' }
});
```

### 3. Analytics & Monitoring
```typescript
// Track access patterns
await track(AnalyticsEvents.API_ACCESS_GRANTED, {
  userId: user.id,
  role: user.role,
  requestId,
  timestamp: new Date().toISOString()
});
```

### 4. Type Safety
- TypeScript throughout
- Zod schemas for validation
- Prisma for type-safe database access
- Shared types package prevents drift

### 5. Repository Pattern
```typescript
// All database access goes through repositories
// Repositories enforce access control
export const restaurantRepository = {
  findManyForUser: async (userId: string) => {
    // Only returns restaurants user has access to
  },
  findAll: async () => {
    // Only callable by platform admin (enforced in API layer)
  }
};
```

---

## Why This Design?

### Advantages

#### 1. Simplified Development
- Single codebase to maintain
- Shared business logic reduces duplication
- Consistent data model across platforms
- Easier to add features that span platforms

#### 2. Data Consistency
- Single source of truth
- No data synchronization issues
- Referential integrity enforced by database
- Transactions work across all entities

#### 3. Cost Efficiency
- One database to manage and pay for
- One application to deploy
- Shared infrastructure
- Reduced operational complexity

#### 4. Feature Velocity
- Changes propagate automatically
- Shared components and utilities
- Consistent user experience
- Faster iteration cycles

#### 5. User Experience
- Single sign-on across platforms
- Seamless role transitions
- Consistent branding and UI patterns
- No data silos

### Disadvantages

#### 1. Blast Radius
- Bug in shared code affects all platforms
- Database issue impacts everyone
- Performance problem cascades

#### 2. Deployment Coupling
- Can't deploy platforms independently
- All platforms must be tested together
- Rollback affects everyone

#### 3. Scaling Complexity
- Can't scale platforms independently
- Database becomes bottleneck
- Different platforms have different load patterns

---

## Scaling Considerations

### Current Architecture (Good for 0-10K users)
```
┌──────────────┐
│   Next.js    │
│  Application │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  PostgreSQL  │
│   Database   │
└──────────────┘
```

### Phase 1: Vertical Scaling (10K-50K users)
```
┌──────────────┐
│   Next.js    │
│  (Larger)    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  PostgreSQL  │
│  (Larger)    │
│  + Indexes   │
│  + Caching   │
└──────────────┘
```

### Phase 2: Read Replicas (50K-200K users)
```
┌──────────────┐
│   Next.js    │
└──────┬───────┘
       │
       ├─────────────┐
       │             │
       ▼             ▼
┌──────────┐   ┌──────────┐
│PostgreSQL│   │PostgreSQL│
│  Primary │   │  Replica │
│ (Writes) │   │  (Reads) │
└──────────┘   └──────────┘
```

### Phase 3: Service Separation (200K+ users)
```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Diner     │  │ Restaurant  │  │  Platform   │
│   Service   │  │   Service   │  │   Service   │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       └────────────────┴────────────────┘
                        │
                        ▼
              ┌──────────────────┐
              │   PostgreSQL     │
              │   (Partitioned)  │
              └──────────────────┘
```

### Phase 4: Microservices (1M+ users)
```
┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
│  Diner  │  │Restaurant│  │Platform │  │ Payment │
│ Service │  │ Service  │  │ Service │  │ Service │
└────┬────┘  └────┬─────┘  └────┬────┘  └────┬────┘
     │            │             │            │
     ├────────────┴─────────────┴────────────┤
     │                                        │
     ▼                                        ▼
┌──────────┐                          ┌──────────┐
│PostgreSQL│                          │PostgreSQL│
│  (Users, │                          │(Payments)│
│  Dinners)│                          └──────────┘
└──────────┘
```

---

## Is This Good for Scaling?

### Short Answer: Yes, for early-stage growth

### Detailed Analysis

#### ✅ Good For (Current Stage)
- **0-50K users:** Excellent choice
- **MVP and validation:** Perfect
- **Rapid iteration:** Ideal
- **Small team:** Manageable
- **Limited budget:** Cost-effective

#### ⚠️ Requires Planning For
- **50K-200K users:** Need read replicas and caching
- **Different load patterns:** Monitor and optimize
- **Geographic distribution:** Consider CDN and edge caching
- **Compliance requirements:** May need data residency

#### ❌ Will Need Refactoring For
- **1M+ users:** Likely need service separation
- **Global scale:** Multi-region deployment
- **High-frequency trading:** Real-time seat booking at massive scale
- **Regulatory isolation:** If different platforms need separate compliance

### Migration Path

The architecture is designed to evolve:

1. **Current:** Monolith with role-based separation
2. **Phase 1:** Add caching and optimization
3. **Phase 2:** Add read replicas
4. **Phase 3:** Extract services behind API gateway (keeping shared DB)
5. **Phase 4:** Separate databases with event-driven sync

The shared packages (`@dinewithme/*`) make this migration easier because business logic is already modularized.

---

## Comparison with Alternatives

### Alternative 1: Separate Applications
```
Diner App → Diner DB
Restaurant App → Restaurant DB
Platform App → Platform DB
```
**Pros:** Complete isolation, independent scaling
**Cons:** Data synchronization nightmare, 3x development cost, inconsistent UX

### Alternative 2: Microservices from Day 1
```
User Service → User DB
Restaurant Service → Restaurant DB
Booking Service → Booking DB
Payment Service → Payment DB
```
**Pros:** Maximum scalability, team independence
**Cons:** Massive complexity, distributed transactions, 10x operational overhead

### Alternative 3: Current Approach (Monolith with Role Separation)
```
Single App → Single DB (with role-based access control)
```
**Pros:** Simple, fast development, data consistency, easy to reason about
**Cons:** Shared fate, scaling requires planning

---

## Recommendations

### For Current Stage (MVP/Early Growth)
✅ **Keep the current architecture**
- It's appropriate for your scale
- Enables fast iteration
- Reduces operational complexity
- Maintains data consistency

### Immediate Actions
1. **Add monitoring:** Track query performance by platform
2. **Optimize indexes:** Ensure all common queries are indexed
3. **Add caching:** Use Next.js caching effectively
4. **Load testing:** Understand breaking points

### Future Considerations
1. **At 10K users:** Review query performance, add caching layer
2. **At 50K users:** Consider read replicas
3. **At 200K users:** Plan service extraction
4. **At 1M users:** Implement microservices architecture

### Red Flags to Watch
- Database CPU consistently >70%
- Query latency >500ms for common operations
- Connection pool exhaustion
- Cross-platform feature conflicts

---

## Conclusion

Your architecture is a **pragmatic, well-designed monolith** that:
- ✅ Shares a single database across all three platforms
- ✅ Uses role-based access control for separation
- ✅ Implements defense-in-depth security
- ✅ Is appropriate for current scale (0-50K users)
- ✅ Can evolve to handle growth
- ⚠️ Requires monitoring and optimization as you scale
- ⚠️ Will need architectural evolution at 200K+ users

The design prioritizes **speed of development** and **data consistency** over **independent scalability**, which is the right trade-off for an early-stage product.
