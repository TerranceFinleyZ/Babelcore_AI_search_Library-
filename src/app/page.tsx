"use client";

import { SignIn } from "@clerk/nextjs";
import AuthShell from "../components/AuthShell";
import { clerkAppearance } from "../lib/clerkAppearance";

export default function LoginPage() {
  return (
    <AuthShell>
      <SignIn
        routing="hash"
        fallbackRedirectUrl="/bench"
        signUpUrl="/sign-up"
        appearance={clerkAppearance}
      />
    </AuthShell>
  );
}
