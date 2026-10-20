# Design System: WorkLink
(Written by hand: the design-md skill needs a Stitch project, which this project does not have.)

## 1. Atmosphere
Calm, confident and spacious, in the manner of Apple's Human Interface Guidelines. Content comes first. Only navigation floats above it on a translucent material (header and mobile tab bar). Content surfaces are opaque.

## 2. Colour
- Canvas Mist (#F8FAFC): page background.
- Pure Surface (#FFFFFF): cards and inputs.
- Ink (#111827): primary text. Slate (#64748B): secondary text.
- WorkLink Blue (#2563EB, pressed #1D4ED8): the single interactive accent: primary buttons, active tab, links.
- Soft Blue (#EFF6FF): selected chips and quiet highlights.
- Signature Lime (#B7F36B): tiny moments only (wordmark dot, "open" indicators). Never behind text.
- Hairline (#E2E8F0), Quiet Fill (#F1F5F9). Semantic: success #15803D, warning #B45309, error #B91C1C.

## 3. Typography
System stack first (SF Pro on Apple devices), Inter next, then Noto Sans Sinhala / Tamil. Regular, medium, semibold and bold only; no light weights. Body 16-17px, large title 40-56px with tight tracking, line length under 65 characters.

## 4. Components
- Buttons: capsule-shaped, at least 44px tall, visible pressed state (slight scale-down). One primary action per view.
- Cards: 16-20px radius, hairline border, no shadow. Lists use inset groups with dividers where cards would repeat.
- Inputs: 12px radius, 16px text (prevents iOS zoom), visible labels above.
- Navigation: translucent top bar on desktop, bottom tab bar with icon and label on mobile. Only real destinations appear.

## 5. Layout and motion
Max width 1024px, 8-point spacing, left-aligned content. One page-load reveal on the landing hero; everything else animates only in response to a tap. All motion is removed under reduced-motion.
