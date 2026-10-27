# Design System: Mithra
(Written by hand: the design-md skill needs a Stitch project, which this project does not have.)

## 1. Atmosphere
Calm, confident and spacious, in the manner of Apple's Human Interface Guidelines. Content comes first. Only navigation floats above it on a translucent material (header and mobile tab bar). Content surfaces are opaque.

## 2. Colour (from the Mithra brand guide)
- Navy Blue (#0B2D3B): trust and stability. Text, links, primary buttons, active tab, app-icon tiles.
- Amber (#F6B23C): warmth and friendliness. Logo accent, highlights, one banner card. Used as a fill or icon colour, never as text on white (low contrast).
- Warm Paper (#F8F6F1): page background. White (#FFFFFF): cards and inputs.
- Slate (#5E7381): secondary text. Hairline (#E6E1D6), Quiet Fill (#F0ECE3), Navy Tint (#E6EEF1) for selected chips.
- Semantic: success #15803D, warning #B45309, error #B91C1C.

## 3. Typography
System stack first (SF Pro on Apple devices), Inter next, then Noto Sans Sinhala / Tamil. Regular, medium, semibold and bold only; no light weights. Body 16-17px, large title 40-56px with tight tracking, line length under 65 characters.

## 4. Components
- Buttons: capsule-shaped, at least 44px tall, visible pressed state (slight scale-down). One primary action per view.
- Cards: 16-20px radius, hairline border, no shadow. Lists use inset groups with dividers where cards would repeat.
- Inputs: 12px radius, 16px text (prevents iOS zoom), visible labels above.
- Navigation: translucent top bar on desktop, bottom tab bar with icon and label on mobile. Only real destinations appear.

## 5. Layout and motion
Max width 1024px, 8-point spacing, left-aligned content. One page-load reveal on the landing hero; everything else animates only in response to a tap. All motion is removed under reduced-motion.

## 6. Everyday-app patterns (inspired by PickMe's ease of use, not its branding)
- Home answers one question: "What do you need today?" A time-based greeting and the user's first name sit above it.
- A large district pill (like a pickup-location chip) and a search field come first. The district choice is remembered and carries into every service screen.
- Services are a 3-column grid of big icon tiles with short labels (two lines at most). Tapping a tile goes straight to workers; no forms.
- A "Recent" row of chips lets people repeat the last services they opened.
- Banner cards (Post a job, Join as a worker, Browse all) scroll sideways on phones and sit in a grid on desktop. Each has a real destination.
- Worker cards lead with the action: full-width Call and WhatsApp buttons, 56px tall.
- Sinhala and Tamil are one tap away in the header.
- No video or heavy imagery: pages must stay fast on slow mobile data.
