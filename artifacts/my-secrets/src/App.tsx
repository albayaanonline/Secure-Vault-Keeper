import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadesOfPurple } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Secrets from "@/pages/secrets";
import SecretDetail from "@/pages/secret-detail";
import NewSecret from "@/pages/new-secret";
import Settings from "@/pages/settings";
import Activity from "@/pages/activity";
import Categories from "@/pages/categories";

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
}

const clerkAppearance = {
  theme: shadesOfPurple,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(191 97% 37%)",
    colorForeground: "hsl(210 40% 98%)",
    colorMutedForeground: "hsl(215 20% 65%)",
    colorDanger: "hsl(0 62.8% 30.6%)",
    colorBackground: "hsl(221 49% 10%)",
    colorInput: "hsl(220 33% 20%)",
    colorInputForeground: "hsl(210 40% 98%)",
    colorNeutral: "hsl(220 33% 20%)",
    fontFamily: "Inter, sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[#0D1526] rounded-2xl w-[440px] max-w-full overflow-hidden border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-white font-bold",
    headerSubtitle: "text-cyan-500/70",
    socialButtonsBlockButtonText: "text-white",
    formFieldLabel: "text-cyan-500/80",
    footerActionLink: "text-cyan-400 hover:text-cyan-300",
    footerActionText: "text-slate-400",
    dividerText: "text-slate-500",
    identityPreviewEditButton: "text-cyan-400",
    formFieldSuccessText: "text-green-400",
    alertText: "text-red-400",
    logoBox: "mb-4",
    logoImage: "w-12 h-12",
    socialButtonsBlockButton: "border border-cyan-500/20 bg-slate-900/50 hover:bg-slate-800/50",
    formButtonPrimary: "bg-cyan-600 hover:bg-cyan-500 text-white",
    formFieldInput: "bg-slate-900/50 border-cyan-500/20 text-white focus:border-cyan-500 focus:ring-cyan-500",
    footerAction: "mt-4",
    dividerLine: "bg-cyan-500/20",
    alert: "border-red-500/20 bg-red-900/20",
    otpCodeFieldInput: "bg-slate-900/50 border-cyan-500/20 text-white",
    formFieldRow: "mb-4",
    main: "p-6",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#050A14] px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-[#050A14] to-[#050A14] pointer-events-none" />
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#050A14] px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-[#050A14] to-[#050A14] pointer-events-none" />
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <Landing />
      </Show>
    </>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <>
      <Show when="signed-in">
        <Component />
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

const queryClient = new QueryClient();

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route path="/dashboard">
              <ProtectedRoute component={Dashboard} />
            </Route>
            <Route path="/secrets">
              <ProtectedRoute component={Secrets} />
            </Route>
            <Route path="/secrets/new">
              <ProtectedRoute component={NewSecret} />
            </Route>
            <Route path="/secrets/:id">
              <ProtectedRoute component={SecretDetail} />
            </Route>
            <Route path="/activity">
              <ProtectedRoute component={Activity} />
            </Route>
            <Route path="/settings">
              <ProtectedRoute component={Settings} />
            </Route>
            <Route path="/categories">
              <ProtectedRoute component={Categories} />
            </Route>
            {/* Other routes can be added here */}
            <Route>
              <div className="min-h-screen flex items-center justify-center bg-[#050A14] text-white">
                <h1 className="text-2xl font-bold">404 Not Found</h1>
              </div>
            </Route>
          </Switch>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  // Ensure dark mode is active on document element
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;