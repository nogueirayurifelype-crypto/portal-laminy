import { redirect } from "next/navigation";

// O financeiro do lojista agora é uma aba da ficha; mantém os links antigos.
export default async function FinanceiroLojistaPage({ params }: PageProps<"/financeiro/[lojistaId]">) {
  const { lojistaId } = await params;
  redirect(`/lojistas/${encodeURIComponent(lojistaId)}?aba=financeiro`);
}
