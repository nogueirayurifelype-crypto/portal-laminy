"use client";

import Link from "next/link";

import { ItemConfirmar, Menu, itemMenu } from "@/components/menu";

import { voltarLojistaParaLead } from "./actions";

/** Menu "⋯" da linha do lojista: abrir, editar e devolver a lead. Espelha o do lead; o status muda na própria linha. */
export function MenuLojista({ id, nome }: { id: string; nome: string }) {
  return (
    <Menu rotulo={`Ações de ${nome}`}>
      <Link href={`/lojistas/${id}`} className={itemMenu}>
        Ver ficha
      </Link>
      <Link href={`/lojistas/${id}/editar`} className={itemMenu}>
        Editar dados
      </Link>
      <div className="my-1 border-t border-line" role="separator" />
      <ItemConfirmar
        action={voltarLojistaParaLead.bind(null, id)}
        rotulo="Voltar para lead"
        aviso="O lojista será removido e voltará a ser um lead qualificado. Só é possível sem conta ou pagamento no financeiro."
        confirmar="Sim, voltar para lead"
      />
    </Menu>
  );
}
