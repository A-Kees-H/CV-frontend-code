# Overview

This is a chat application that enables users to interact with an AI assistant about CV/resume information. The application features a React-based frontend with a shadcn/ui component library and an Express backend. The chat interface allows users to ask questions about resumes and receive AI-generated responses from an external LLM API service. The application includes a built-in PDF viewer for displaying the CV document with smooth slide-up animations.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework & Build System**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server, configured to serve from the `client` directory
- Wouter for lightweight client-side routing (single page application)

**UI Component System**
- shadcn/ui component library (New York style variant) providing a comprehensive set of pre-built, accessible UI components
- Radix UI primitives for headless, accessible component foundations
- TailwindCSS with CSS variables for theming and responsive design
- Dark mode support built into the design system

**State Management & Data Fetching**
- TanStack Query (React Query) for server state management and API communication
- Custom query client configuration with disabled refetching and infinite stale time
- Local component state using React hooks for UI interactions

**Key Design Patterns**
- Component composition with shadcn/ui's modular architecture
- Custom hooks for reusable logic (useToast, useIsMobile, useFormField)
- Path aliases (@/, @shared/, @assets/) for clean imports

**PDF Viewer Feature**
- Slide-up drawer component for displaying CV document
- Located at bottom of chat interface with "View CV (PDF)" button
- Takes 90% of viewport height with 90% width container for PDF
- Multiple close methods: ESC key, header click, X button, backdrop click
- Smooth slide-in/slide-out animations (500ms duration)
- PDF file served from client/public/cv.pdf

## Backend Architecture

**Server Framework**
- Express.js with TypeScript for the HTTP server
- ESM module system (type: "module" in package.json)
- Custom middleware for request/response logging with JSON capture

**Development & Production Setup**
- Vite middleware integration in development mode for HMR and SSR capabilities
- Static file serving in production from dist/public
- esbuild for server-side bundling in production builds
- tsx for development execution with hot reloading

**Session Management**
- Client-side session ID generation using timestamp and random string
- Session state maintained in frontend, passed to external API
- No server-side session storage (stateless backend for chat functionality)

**API Integration**
- External LLM API (https://llm-cv-api.onrender.com) for AI-powered CV query responses
- RESTful communication pattern with POST requests for chat queries
- Request/response schema validation using Zod

## Data Storage

**Database Configuration**
- Drizzle ORM configured with PostgreSQL dialect
- Neon Database serverless driver (@neondatabase/serverless)
- Schema defined in shared/schema.ts for type sharing between client and server
- Migration files stored in ./migrations directory

**Current Data Models**
- Message schema: id, role (user/assistant), content, timestamp
- ChatSession schema: sessionId, messages array
- QueryRequest schema: session_id, prompt (1-1000 chars)
- QueryResponse schema: answer, optional error

**Storage Implementation**
- MemStorage class provides an in-memory storage interface (IStorage)
- Database infrastructure configured but storage operations not yet implemented
- Designed for future integration of persistent chat history

## External Dependencies

**Third-Party Services**
- LLM CV API (llm-cv-api.onrender.com): External AI service for processing resume-related queries
- Neon Database: Serverless PostgreSQL database (configured but not actively used)

**Key Libraries**
- React Hook Form with Zod resolvers for form validation
- date-fns for date manipulation
- lucide-react for iconography
- embla-carousel-react for carousel functionality
- vaul for drawer components

**Development Tools**
- Replit-specific plugins for development environment (cartographer, dev-banner, runtime-error-modal)
- TypeScript with strict mode for type safety
- PostCSS with Tailwind and Autoprefixer for CSS processing

**Authentication & Security**
- No authentication system currently implemented
- Sessions are client-generated and ephemeral
- API requests include credentials for potential future auth integration