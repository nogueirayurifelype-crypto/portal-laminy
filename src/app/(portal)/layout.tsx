import { connection } from "next/server";
import { Suspense } from "react";

import { auth, signOut } from "@/auth";
import { IconeSair } from "@/components/icones";
import { Sidebar } from "@/components/nav";

async function Usuario() {
  await connection(); // ver requireSession()
  const session = await auth();
  return <span className="min-w-0 truncate text-xs text-muted">{session?.user?.email}</span>;
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
                aria-label="Sair"
                title="Sair"
                className="inline-flex size-9 cursor-pointer items-center justify-center rounded-md text-muted transition-colors hover:bg-mist hover:text-black"
              >
                <IconeSair />
              </button>
            </form>
          </>
        }
      />
      <main className="px-4 py-6 sm:px-8 lg:ml-60 lg:px-12 lg:py-10">
        <div className="mx-auto w-full max-w-[1120px]">{children}</div>
      </main>
    </div>
  );
}
