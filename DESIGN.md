---
name: Vibrant Reliability
colors:
  surface: '#fdfcf0' # Cream real
  surface-dim: '#e2e1d4'
  surface-bright: '#fdfcf0'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f7f6ec'
  surface-container: '#f1f0e6'
  surface-container-high: '#ebeae1'
  surface-container-highest: '#e5e4db'
  on-surface: '#0b1339' # Navy
  on-surface-variant: '#46464e'
  inverse-surface: '#0b1339'
  inverse-on-surface: '#fdfcf0'
  outline: '#76767f'
  outline-variant: '#c7c5cf'
  primary: '#0b1339' # Deep Navy
  on-primary: '#ffffff'
  primary-container: '#21284e'
  on-primary-container: '#bdc4f3'
  secondary: '#00696d' # Cyan
  on-secondary: '#ffffff'
  secondary-container: '#9bf1f5'
  accent: '#F69926' # Orange
  on-accent: '#ffffff'
  background: '#fdfcf0' # Cream
  on-background: '#0b1339'
  navy: '#0b1339'
  orange: '#F69926'
  cyan: '#00696d'
  cream: '#fdfcf0'
typography:
  h1:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  h2:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  h3:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
    letterSpacing: '0'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-bold:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  container-max: 1200px
  gutter: 24px
---

## Brand & Style

The design system is anchored in the concept of "Confiabilidade Vibrante" (Vibrant Reliability). It balances the sophisticated, institutional stability required for a financial marketplace with the energetic, grassroots spirit of the Brazilian workforce. The aesthetic is **Corporate / Modern**, utilizing the warmth of the cream background to move away from cold, sterile tech environments and toward a more human-centric, accessible experience.

This design system aims to evoke a sense of immediate opportunity and mutual respect. The interface remains clean and professional to build trust between service providers and clients, while the high-contrast accents reflect the "Faz tua grana" energy—fast, decisive, and empowering.

## Colors

The color palette is designed to stand out in a saturated SaaS market. **Deep Navy** serves as the foundation, providing a sense of authority and professional grounding. **Cream Background** is used instead of pure white to reduce eye strain and provide a "paper-like" physical quality that feels more tactile and local.

**Accent Orange** is the primary driver for "Energy" and Call-to-Actions (CTAs), symbolizing movement and success. **Secondary Cyan** is reserved for positive feedback, success states, and secondary actions, offering a cool contrast to the warm palette. Neutral shades are derived from the Navy core to ensure a harmonious, monochromatic transition in text and borders.

## Typography

The design system utilizes **Inter** exclusively to maintain a highly functional, systematic appearance. To achieve the "Modern SaaS" aesthetic, the typography relies on extreme weight contrast. Headings are set to Bold or Extra Bold (800) with tighter letter spacing to create a sense of urgency and impact.

Body text is optimized for readability against the cream background using a slightly increased line height (1.5 - 1.6). Labels use a medium-to-semibold weight to ensure they remain legible when used on top of colorful chips or high-action buttons.

## Layout & Spacing

The layout follows a **Fixed Grid** model for desktop viewports, centering content within a 1200px container to maintain focus. For mobile and tablet, a fluid 4-column and 8-column grid is used respectively. 

A strict 8px base-unit defines the spacing rhythm. Internal component padding (e.g., inside cards) should favor the `md` (24px) unit to ensure the UI feels airy and premium. Section-to-section vertical spacing should use `xl` (80px) to create distinct visual breaks between different types of service listings or value propositions.

## Elevation & Depth

Hierarchy is established through **Tonal Layers** combined with **Low-Contrast Outlines**. Instead of heavy, black shadows, this design system uses soft, diffused shadows tinted with the Primary Navy color at very low opacities (e.g., 4-8%). This prevents the shadows from looking "dirty" against the cream background.

Interactive elements like cards use a subtle 1px border (#21284E at 10% opacity) to define their boundaries. When an element is hovered, the elevation increases slightly, and the border color shifts to the Secondary Cyan to provide clear interactive feedback.

## Shapes

The design system adopts a **Rounded** shape language. This level of roundedness (0.5rem base) strikes the perfect balance between the friendliness of a local community marketplace and the precision of a professional tool. 

Larger containers like service cards or promotional banners use a more pronounced radius (1rem) to feel approachable, while small utility elements like input fields or checkboxes maintain the base 0.5rem to look sharp and efficient.

## Components

### Buttons
- **Primary:** Accent Orange background with Navy text for maximum "pop" and energy.
- **Secondary:** Deep Navy background with White text for a professional, grounded look.
- **Ghost:** Navy borders and text, used for less critical actions like "View Details."

### Cards
Service cards feature a white background to contrast against the cream page background. They include a subtle border and the Navy-tinted shadow. The header of the card should use H3 Bold for the service title.

### Input Fields
Inputs utilize a white background with a 1.5px Navy border. On focus, the border transitions to Secondary Cyan. Labels are always positioned above the field in `label-bold` style.

### Chips & Badges
Used for service categories (e.g., "Plumbing," "Cleaning"). These use light tints of the Secondary Cyan or Deep Navy with high-contrast text. Status badges for "Available Now" or "Verified" use the Accent Orange to draw immediate attention.

### Specific Components
- **The "Trampo" Tracker:** A vertical list component showing service progress, utilizing Cyan for completed steps and Navy for upcoming ones.
- **Provider Profile Mini-Card:** A compact component featuring a rounded-full avatar and a prominent rating star in Accent Orange.