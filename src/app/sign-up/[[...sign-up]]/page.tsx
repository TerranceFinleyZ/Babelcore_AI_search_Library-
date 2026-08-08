"use client";

import { SignUp } from "@clerk/nextjs";
import AuthShell from "../../../components/AuthShell";
import { clerkAppearance } from "../../../lib/clerkAppearance";

export default function SignUpPage() {
  return (
    <AuthShell>
      <SignUp
        routing="path"
        path="/sign-up"
        fallbackRedirectUrl="/bench"
        signInUrl="/sign-in"
        appearance={clerkAppearance}
      />
    </AuthShell>
  );
}
