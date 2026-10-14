import { connection } from "next/server";
import { Suspense } from "react";

import { auth, signOut } from "@/auth";
import { Sidebar } from "@/components/nav";

async function Usuario() {
  await connection(); // ver requireSession()
  const session = await auth();
  return <span className="truncate font-mono text-xs text-white/65">{session?.user?.email}</span>;
}

export default function PortalLayout({ children }: LayoutProps<"/">) {
  async function sair() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="min-h-screen">
      <Sidebar
        rodape={
          <>
            <Suspense>
              <Usuario />
            </Suspense>
            <form action={sair}>
              <button
                type="submit"
                className="inline-flex min-h-10 cursor-pointer items-center rounded-full border border-white/25 px-4 text-sm font-medium text-white transition-colors hover:border-white/60"
              >
                Sair
              </button>
            </form>
          </>
        }
      />
      <main className="px-4 py-8 sm:px-8 lg:ml-60 lg:px-10 lg:py-10">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
