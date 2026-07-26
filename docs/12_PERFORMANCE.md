# 12 Performance & Optimization Strategies

## Target Metrics
- **Lighthouse Performance Score**: > 95
- **First Contentful Paint (FCP)**: < 0.8s
- **Time to Interactive (TTI)**: < 1.5s
- **API p95 Response Time**: < 120ms (Excluding LLM generation calls)

## Optimization Tactics
1. **Server-Side Rendering (SSR)**: Critical job details and landing pages pre-rendered via Next.js RSC.
2. **Caching Strategy**: Redis caching for frequent search queries and metadata lookup.
3. **Asset & Image Optimization**: WebP auto-conversion and dynamic image sizing.
