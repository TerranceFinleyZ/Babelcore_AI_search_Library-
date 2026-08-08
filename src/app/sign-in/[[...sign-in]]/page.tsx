"use client";

import { SignIn } from "@clerk/nextjs";
import AuthShell from "../../../components/AuthShell";
import { clerkAppearance } from "../../../lib/clerkAppearance";

export default function SignInPage() {
  return (
    <AuthShell>
      <SignIn
        routing="path"
        path="/sign-in"
        fallbackRedirectUrl="/bench"
        signUpUrl="/sign-up"
        appearance={clerkAppearance}
      />
    </AuthShell>
  );
}
