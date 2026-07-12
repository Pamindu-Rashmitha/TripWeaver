import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Match all routes
const isProtectedRoute = createRouteMatcher(["/(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html|css|js(?!on)|jpeg|jpg|gif|svg|png|ico|txt|woff2?|otf|ttf|map|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
