# 10 Design System Specifications

## Color Tokens

```css
:root {
  --bg-primary: #09090B;
  --bg-secondary: #111827;
  --bg-card: #18181B;
  --border-subtle: #27272A;
  
  --accent-blue: #3B82F6;
  --accent-purple: #8B5CF6;
  
  --status-emerald: #10B981;
  --status-amber: #F59E0B;
  --status-rose: #EF4444;
  
  --text-primary: #FFFFFF;
  --text-secondary: #9CA3AF;
  --text-muted: #64748B;
}
```

## Typography Hierarchy
- **Hero Title**: `4rem / 64px`, Extra Bold, `tracking-tight`
- **Section Heading**: `2.25rem / 36px`, SemiBold
- **Card Title**: `1.25rem / 20px`, Medium
- **Body Text**: `1rem / 16px`, Regular, `leading-relaxed`
- **Caption / Muted**: `0.875rem / 14px`, Regular

## Components & Micro-Interactions
- **Glass Card**: Background `rgba(24, 24, 27, 0.7)`, border `1px solid #27272A`, backdrop blur `12px`.
- **Primary Button**: Electric blue gradient background, scale up `1.02` on hover with shadow glow.
