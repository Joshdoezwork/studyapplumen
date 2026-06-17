import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/600.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  useNavigate,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppShell } from "../components/AppShell";
import { AuthProvider, useAuth } from "../lib/auth-context";

function NotFoundComponent() {
  return (
    <Gate>
      <div className="grid place-items-center py-32 text-center">
        <h1 className="font-display text-6xl font-semibold">404</h1>
        <p className="mt-2 text-muted-foreground">This page drifted off into the night sky.</p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          Back to dashboard
        </Link>
      </div>
    </Gate>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <Gate>
      <div className="grid place-items-center py-32 text-center">
        <h1 className="font-display text-3xl font-semibold">Something went wrong</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          A glitch in the constellation. Try again or head back home.
        </p>
        <div className="mt-6 flex gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </button>
          <Link
            to="/"
            className="rounded-lg border border-border bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10"
          >
            Go home
          </Link>
        </div>
      </div>
    </Gate>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Lumen — Study under the stars" },
      {
        name: "description",
        content:
          "A calm study companion for high schoolers: flashcards, notes, focus timer, goals, and quiz games.",
      },
      { name: "author", content: "Lumen" },
      { property: "og:title", content: "Lumen — Study under the stars" },
      {
        property: "og:description",
        content:
          "Flashcards, notes, focus timer, goals, and quiz games for high schoolers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Gate>
          <Outlet />
        </Gate>
        <Toaster theme="dark" position="top-center" />
      </AuthProvider>
    </QueryClientProvider>
  );
}

// Gate: redirect to /auth when no session/profile; show shell only when allowed.
function Gate({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { session, profile, loading } = useAuth();
  const navigate = useNavigate();
  const isAuthRoute = pathname === "/auth";

  useEffect(() => {
    if (loading) return;
    if (!session && !isAuthRoute) {
      navigate({ to: "/auth", replace: true });
    } else if (session && !profile && !isAuthRoute) {
      // signed in but no profile (e.g. OAuth) — finish onboarding
      navigate({ to: "/auth", replace: true });
    }
  }, [loading, session, profile, isAuthRoute, navigate]);

  if (isAuthRoute) return <>{children}</>;
  if (loading || !session || !profile) {
    return (
      <div className="aurora-bg grid min-h-screen place-items-center">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }
  return <AppShell>{children}</AppShell>;
}
