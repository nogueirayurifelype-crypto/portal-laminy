"use client";

import Link from "next/link";

import { ItemConfirmar, Menu, itemMenu } from "@/components/menu";

import { aprovarLeadEAbrir, desfazerAprovacao } from "./actions";

/** Menu "⋯" da linha do lead: abrir, editar e passar para lojista (ou desfazer). Espelha o do lojista. */
export function MenuLead({
  id,
  nome,
  status,
  lojistaId,
}: {
  id: string;
  nome: string;
  status: string;
  lojistaId: string | null;
}) {
  return (
    <Menu rotulo={`Ações de ${nome}`}>
      <Link href={`/campanhas/leads/${id}`} className={itemMenu}>
        Ver ficha
      </Link>
      <Link href={`/campanhas/leads/${id}/editar`} className={itemMenu}>
        Editar dados
      </Link>
      {lojistaId ? (
        <>
          <Link href={`/lojistas/${lojistaId}`} className={itemMenu}>
            Ver lojista
          </Link>
          <div className="my-1 border-t border-line" role="separator" />
          <ItemConfirmar
            action={desfazerAprovacao.bind(null, id)}
            rotulo="Desfazer aprovação"
            aviso="O lojista criado será removido e o lead volta a qualificado. Só é possível sem conta ou pagamento no financeiro."
            confirmar="Sim, desfazer"
          />
        </>
      ) : (
        status !== "descartado" && (
          <>
            <div className="my-1 border-t border-line" role="separator" />
            <ItemConfirmar
              tom="normal"
              action={aprovarLeadEAbrir.bind(null, id)}
              rotulo="Aprovar e criar lojista"
              aviso="Cria um lojista com os dados deste lead e abre a ficha dele."
              confirmar="Sim, aprovar"
            />
          </>
        )
      )}
    </Menu>
  );
}
