# DEVELOPMENT_LOG: jimin.garden

## 1. Frontend Audit & Feature Extraction

### Visual Engine
The core aesthetic relies on an "Acid Chartreuse" (`#D4FF00`) neo-terminal theme over deep black backgrounds.
- **Dithering/Jitter Shaders**: Powered by `@paper-design/shaders-react`, mapping distinct noise patterns (simplex, dots) across different views.
- **Reactive Text Scramble**: A custom brute-force decryption effect (`ReactiveTextScramble`) renders real-time keystrokes using high-speed `requestAnimationFrame` and deterministic character arrays.
- **Digital Rain**: A customized `<DigitalRain>` HTML5 canvas component dynamically speeds up and increases in density based on the character length of the email input.
- **Waveform Overlay**: A `mix-blend-screen` CSS-based audio waveform that reacts procedurally to the `message` input using `Math.sin()`.

### Component Map
- **Public Views**:
  - `/home`: Split-panel Hero section with contact info and Dithering shader.
  - `/notes`: Topic-filtered digital garden list.
  - `/projects`: Featured work list with external repository/demo links.
  - `/contact`: Reactive data visualization terminal with Acid Chartreuse feedback.
  - `/post-detail` & `/project-detail`: Markdown/TipTap rendered detail pages.
- **Admin Views**:
  - `/overview`: Terminal-styled analytics dashboard (Traffic, Latency, Stats).
  - `/content`: Unified Post/Project Creator with Markdown/Rich Text toggle.
  - `/manage-posts`: Draggable interface for managing live content.
  - `/newsletter`: Targeted email dispatcher interface.

### Responsive State
The UI is built with a hard-coded `w-1/2` split-panel Flexbox architecture. **Current Gap**: the panels require `flex-col lg:flex-row` and `w-full lg:w-1/2` Tailwind logic to prevent viewport constraints on mobile devices.

### Content Rendering
Currently, the prototype uses an array of mock data and hardcoded string parsing for markdown components (`>` for blockquotes, ```` for code blocks). The actual TipTap HTML JSON payload integration is verified via planning but requires the backend API schema to become fully operational.

---

## 2. Backend Requirement Specification

### Data Persistence (PostgreSQL + Prisma)
The infrastructure requires a standard relational schema:
- **User**: Protected Admin Credentials (hashed password).
- **Post**: TipTap `content` JSON, `htmlContent`, `tags` relation, `isProject` toggle, and atomical view count.
- **Tag**: M:N relation for post categorization.
- **Subscriber**: Newsletter audiences tied to respective topics (`["AI", "InfoSec"]`).
- **ContactMessage**: Persistent store of real-time inquiries.
- **Analytics**: Path, referrer, browser, and duration logging.

### API Architecture (Next.js App Router)
- `GET /api/posts`: Cursor-based pagination, dynamic topic filtering.
- `GET /api/posts/[id]`: Content fetch and atomic view increment logic.
- `POST /api/subscribe`: Newsletter insertion.
- `POST /api/contact`: Form storage.
- `GET /api/contact/stream`: Server-Sent Events (SSE) connection handling live typing "handshake" logs (Current implementation is simulated frontend-only).
- **Protected Endpoints**: `POST /api/admin/posts` and `POST /api/admin/newsletter`.

### Auth System
**NextAuth.js (Auth.js)** will wrap all `/api/admin/*` endpoints and the `/admin` UI boundaries. The strategy requires a `CredentialsProvider` mapping against the hashed password located in the `User` table, secured via environment variables and JWT session strategies.
