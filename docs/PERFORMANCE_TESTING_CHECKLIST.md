# Performance Testing Checklist

## Pre-Deployment Performance Verification

Use this checklist before deploying to production to ensure all performance optimizations are in place and working correctly.

---

## 1. Image Optimization ✅

### Verification Steps
- [ ] All `<img>` tags replaced with Next.js `<Image>` component
- [ ] Image domains configured in `next.config.ts`
- [ ] Images have proper `width` and `height` attributes
- [ ] Images use appropriate formats (WebP/AVIF)
- [ ] Large images are optimized (< 500KB each)

### How to Check
```bash
# Search for img tags (should return no results in components)
grep -r "<img" src/components src/app --include="*.tsx" --include="*.jsx"

# Check next.config.ts for image configuration
cat next.config.ts | grep -A 10 "images:"
```

### Expected Result
✅ No `<img>` tags found in components
✅ Image domains configured
✅ All images load with Next.js optimization

---

## 2. Lazy Loading Implementation ✅

### Verification Steps
- [ ] Heavy chart components lazy loaded (recharts)
- [ ] Calendar components lazy loaded (react-big-calendar)
- [ ] Dialog/Modal components lazy loaded
- [ ] Below-the-fold components lazy loaded
- [ ] Loading states provided for all lazy components

### How to Check
```bash
# Check for dynamic imports
grep -r "dynamic(" src/app --include="*.tsx" -A 2

# Check for lazy imports
grep -r "lazy(" src/app --include="*.tsx" -A 2
```

### Expected Result
✅ Chart components use `dynamic()` import
✅ Loading skeletons visible during load
✅ No layout shift when components load

---

## 3. Bundle Size Optimization ✅

### Verification Steps
- [ ] Production build completes successfully
- [ ] Initial bundle size < 500KB
- [ ] First Load JS < 400KB per page
- [ ] No duplicate dependencies
- [ ] Tree shaking working correctly

### How to Check
```bash
# Build for production
npm run build

# Check output for bundle sizes
# Look for:
# - Route sizes
# - First Load JS
# - Shared chunks
```

### Expected Results
```
Route (app)                              Size     First Load JS
┌ ○ /                                   15.2 kB        350 kB
├ ○ /admin                              25.3 kB        450 kB
├ ○ /project-manager                    28.7 kB        480 kB
└ ○ /team-member                        22.1 kB        420 kB
```

### Acceptance Criteria
✅ Initial bundle < 500KB
✅ First Load JS < 500KB per page
✅ Build completes without errors

---

## 4. Loading States & Skeletons ✅

### Verification Steps
- [ ] Loading skeletons implemented for all pages
- [ ] Skeleton matches actual content layout
- [ ] No layout shift when content loads
- [ ] Loading states for async operations
- [ ] Error states handled gracefully

### How to Check
```bash
# Check for loading.tsx files
find src/app -name "loading.tsx"

# Check for Skeleton components
grep -r "Skeleton" src/components src/app --include="*.tsx"
```

### Manual Testing
1. Open DevTools Network tab
2. Throttle to "Slow 3G"
3. Navigate to each page
4. Verify loading states appear
5. Verify no layout shift

### Expected Result
✅ Smooth loading experience
✅ No content jumping
✅ Professional loading animations

---

## 5. Caching Strategy ✅

### Verification Steps
- [ ] Static assets have long cache headers
- [ ] API routes have appropriate cache headers
- [ ] Database queries use connection pooling
- [ ] Stale-while-revalidate implemented where appropriate

### How to Check
```bash
# Check next.config.ts for cache headers
cat next.config.ts | grep -A 20 "headers()"

# Test API caching (after deployment)
curl -I https://your-app.vercel.app/api/health
# Look for Cache-Control header
```

### Expected Result
✅ Static assets: `Cache-Control: public, max-age=31536000, immutable`
✅ API routes: Appropriate cache headers based on data freshness
✅ Database: Connection pooling enabled

---

## 6. Lighthouse Audit 🎯

### Verification Steps
- [ ] Performance score > 90
- [ ] First Contentful Paint < 1.8s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Time to Interactive < 3.8s
- [ ] Total Blocking Time < 300ms
- [ ] Cumulative Layout Shift < 0.1

### How to Run
```bash
# Option 1: Chrome DevTools
# 1. Open page in Chrome
# 2. F12 → Lighthouse tab
# 3. Select Performance
# 4. Click "Analyze page load"

# Option 2: CLI
lighthouse https://your-app.vercel.app --view

# Option 3: Helper script
node scripts/lighthouse-audit.js https://your-app.vercel.app
```

### Key Pages to Test
1. Landing page (/)
2. Login page (/login)
3. Admin dashboard (/admin)
4. Project Manager dashboard (/project-manager)
5. Team Member dashboard (/team-member)

### Acceptance Criteria
| Metric | Target | Status |
|--------|--------|--------|
| Performance Score | > 90 | ⏳ |
| FCP | < 1.8s | ⏳ |
| LCP | < 2.5s | ⏳ |
| TTI | < 3.8s | ⏳ |
| TBT | < 300ms | ⏳ |
| CLS | < 0.1 | ⏳ |

---

## 7. Network Performance 🌐

### Verification Steps
- [ ] Test on Fast 3G network
- [ ] Test on Slow 3G network
- [ ] Test on offline mode (service worker)
- [ ] Verify graceful degradation
- [ ] Check for failed requests

### How to Test
```bash
# Chrome DevTools
# 1. Open DevTools (F12)
# 2. Network tab
# 3. Throttling dropdown
# 4. Select "Slow 3G" or "Fast 3G"
# 5. Reload page
# 6. Verify acceptable performance
```

### Acceptance Criteria
✅ Page loads in < 5s on Fast 3G
✅ Page loads in < 10s on Slow 3G
✅ No failed requests
✅ Graceful error handling

---

## 8. Database Query Performance 🗄️

### Verification Steps
- [ ] Connection pooling enabled
- [ ] Queries use proper indexes
- [ ] N+1 queries eliminated
- [ ] Pagination implemented for large datasets
- [ ] Select only needed fields

### How to Check
```bash
# Check Prisma configuration
cat prisma/schema.prisma | grep "@@index"

# Check for connection pooling in .env
cat .env | grep "pgbouncer"
```

### Manual Testing
1. Open DevTools Console
2. Navigate to data-heavy pages
3. Check for slow query warnings
4. Verify queries complete in < 500ms

### Expected Result
✅ All queries < 500ms
✅ No N+1 query warnings
✅ Connection pooling active

---

## 9. Mobile Performance 📱

### Verification Steps
- [ ] Test on actual mobile device
- [ ] Test on mobile emulator
- [ ] Touch targets > 44x44px
- [ ] No horizontal scrolling
- [ ] Responsive images load correctly

### How to Test
```bash
# Chrome DevTools
# 1. F12 → Toggle device toolbar (Ctrl+Shift+M)
# 2. Select mobile device
# 3. Test all pages
# 4. Verify touch interactions

# Lighthouse Mobile Audit
lighthouse https://your-app.vercel.app --preset=mobile --view
```

### Acceptance Criteria
✅ Mobile Lighthouse score > 85
✅ All touch targets accessible
✅ No horizontal scroll
✅ Images optimized for mobile

---

## 10. Production Build Verification ✅

### Verification Steps
- [ ] Build completes without errors
- [ ] No console errors in production
- [ ] Environment variables set correctly
- [ ] All features work in production mode
- [ ] No development-only code in build

### How to Check
```bash
# Build for production
npm run build

# Start production server locally
npm run start

# Open http://localhost:3000
# Check console for errors
# Test all major features
```

### Expected Result
✅ Build successful
✅ No console errors
✅ All features functional
✅ Production optimizations active

---

## 11. Security Headers (Performance Impact) 🔒

### Verification Steps
- [ ] Security headers configured
- [ ] Headers don't impact performance
- [ ] HTTPS enforced
- [ ] CSP configured (if applicable)

### How to Check
```bash
# After deployment
curl -I https://your-app.vercel.app

# Look for:
# - X-Frame-Options
# - X-Content-Type-Options
# - Strict-Transport-Security
# - Referrer-Policy
```

### Expected Result
✅ All security headers present
✅ No performance degradation
✅ HTTPS enforced

---

## 12. Monitoring Setup 📊

### Verification Steps
- [ ] Vercel Analytics enabled
- [ ] Error tracking configured
- [ ] Health check endpoint working
- [ ] Uptime monitoring configured (UptimeRobot)

### How to Check
```bash
# Test health endpoint
curl https://your-app.vercel.app/api/health

# Expected response:
# {
#   "status": "healthy",
#   "timestamp": "...",
#   "services": {
#     "database": "healthy",
#     "api": "healthy"
#   }
# }
```

### Expected Result
✅ Analytics tracking pageviews
✅ Health endpoint returns 200
✅ Uptime monitoring active
✅ Error tracking working

---

## Final Checklist Summary

### Before Deployment
- [ ] All images optimized
- [ ] Lazy loading implemented
- [ ] Bundle size acceptable
- [ ] Loading states working
- [ ] Caching configured
- [ ] Local Lighthouse audit passed
- [ ] Network throttling tested
- [ ] Database queries optimized
- [ ] Mobile testing complete
- [ ] Production build successful
- [ ] Security headers configured
- [ ] Monitoring setup complete

### After Deployment
- [ ] Production Lighthouse audit
- [ ] Vercel Analytics verified
- [ ] Health check working
- [ ] All pages load < 3s
- [ ] No console errors
- [ ] Mobile performance verified
- [ ] Core Web Vitals green
- [ ] Uptime monitoring active

---

## Performance Targets Summary

| Metric | Target | Critical |
|--------|--------|----------|
| Initial Page Load | < 3s | ✅ Yes |
| First Contentful Paint | < 1.8s | ✅ Yes |
| Largest Contentful Paint | < 2.5s | ✅ Yes |
| Time to Interactive | < 3.8s | ✅ Yes |
| Total Blocking Time | < 300ms | ⚠️ Important |
| Cumulative Layout Shift | < 0.1 | ⚠️ Important |
| Lighthouse Performance | > 90 | ⚠️ Important |
| Bundle Size | < 500KB | ⚠️ Important |

---

## Troubleshooting Common Issues

### Issue: Slow Page Load
**Possible Causes**:
- Large bundle size
- Heavy components not lazy loaded
- Slow database queries
- Large images

**Solutions**:
1. Check bundle size: `npm run build`
2. Implement lazy loading for heavy components
3. Optimize database queries
4. Compress images

### Issue: Poor Lighthouse Score
**Possible Causes**:
- Render-blocking resources
- Large images
- Unused JavaScript
- No caching

**Solutions**:
1. Lazy load below-the-fold content
2. Use Next.js Image component
3. Implement code splitting
4. Configure caching headers

### Issue: Layout Shift (High CLS)
**Possible Causes**:
- Images without dimensions
- Dynamic content insertion
- Web fonts loading

**Solutions**:
1. Add width/height to all images
2. Reserve space for dynamic content
3. Use font-display: swap

---

## Resources

### Tools
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [WebPageTest](https://www.webpagetest.org/)
- [GTmetrix](https://gtmetrix.com/)
- [PageSpeed Insights](https://pagespeed.web.dev/)

### Documentation
- [Next.js Performance](https://nextjs.org/docs/advanced-features/measuring-performance)
- [Web Vitals](https://web.dev/vitals/)
- [Vercel Analytics](https://vercel.com/docs/analytics)

---

**Last Updated**: ${new Date().toISOString()}
**Review Before Each Deployment**: Yes
**Owner**: Development Team
