import type { ReactNode } from "react";

type AuthShellProps = {
  children: ReactNode;
};

export default function AuthShell({ children }: AuthShellProps) {
  return (
    <main className="min-h-screen bg-black px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-7xl flex-col overflow-hidden rounded-[2rem] border border-orange-500/20 bg-zinc-950/90 shadow-2xl shadow-orange-950/30 backdrop-blur lg:flex-row">
        <section className="auth-section flex w-full flex-col items-center justify-center px-6 py-8 sm:px-10 lg:w-1/2 lg:items-start lg:px-14">
          <div className="mx-auto w-full max-w-md">{children}</div>
        </section>

        <aside className="flex w-full items-center justify-center bg-gradient-to-br from-orange-600/20 via-zinc-900 to-red-600/20 lg:w-1/2">
          <video
            className="h-[32rem] w-full object-cover sm:h-[38rem] lg:h-full"
            autoPlay
            muted
            loop
            playsInline
            controls={false}
          >
            <source src="/CoremainVid.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </aside>
      </div>
      <p className="mt-4 text-center text-xs text-orange-300">
        &copy; {new Date().getFullYear()} Core. All Rights Reserved.
      </p>
    </main>
  );
}