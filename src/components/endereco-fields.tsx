"use client";

import { useRef, useState } from "react";

import { Grid } from "@/components/fields";

type Endereco = {
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

type Resposta = { street?: string; neighborhood?: string; city?: string; state?: string; location?: { coordinates?: { latitude?: string | number; longitude?: string | number } } };

const mascara = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
};

const numero = (v: string | number | undefined) => {
  const n = Number(v);
  return v !== undefined && v !== "" && Number.isFinite(n) ? String(n) : "";
};

/**
 * Bloco de endereço: ao completar o CEP (8 dígitos) consulta a BrasilAPI e preenche logradouro,
 * bairro, cidade e UF. Latitude/longitude não aparecem: vão em campos ocultos (mantêm o valor
 * salvo e, quando a consulta trouxer coordenadas, passam a usar as novas).
 */
export function EnderecoFields({ valor }: { valor?: Endereco }) {
  const [cep, setCep] = useState(mascara(valor?.cep ?? ""));
  const [logradouro, setLogradouro] = useState(valor?.logradouro ?? "");
  const [bairro, setBairro] = useState(valor?.bairro ?? "");
  const [cidade, setCidade] = useState(valor?.cidade ?? "");
  const [uf, setUf] = useState(valor?.uf ?? "");
  const [coords, setCoords] = useState({ lat: valor?.latitude ?? "", lng: valor?.longitude ?? "" });
  const [situacao, setSituacao] = useState<{ tipo: "buscando" | "ok" | "erro"; texto: string } | null>(null);
  const ultima = useRef("");

  async function buscar(digitos: string) {
    ultima.current = digitos;
    setSituacao({ tipo: "buscando", texto: "Buscando CEP…" });
    try {
      const r = await fetch(`https://brasilapi.com.br/api/cep/v2/${digitos}`);
      if (ultima.current !== digitos) return; // CEP mudou durante a busca
      if (r.status === 404) {
        setSituacao({ tipo: "erro", texto: "CEP não encontrado. Confira o número ou preencha o endereço manualmente." });
        return;
      }
      if (!r.ok) throw new Error();
      const d: Resposta = await r.json();
      if (d.street) setLogradouro(d.street);
      if (d.neighborhood) setBairro(d.neighborhood);
      if (d.city) setCidade(d.city);
      if (d.state) setUf(d.state);
      const c = d.location?.coordinates;
      setCoords({ lat: numero(c?.latitude), lng: numero(c?.longitude) });
      setSituacao({ tipo: "ok", texto: "Endereço preenchido pelo CEP." });
    } catch {
      if (ultima.current === digitos) {
        setSituacao({ tipo: "erro", texto: "Não foi possível consultar o CEP agora. Preencha manualmente." });
      }
    }
  }

  return (
    <>
      <Grid>
        <label>
          CEP
          <input
            name="cep"
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="00000-000"
            value={cep}
            aria-invalid={situacao?.tipo === "erro" || undefined}
            onChange={(e) => {
              const m = mascara(e.target.value);
              setCep(m);
              const d = m.replace(/\D/g, "");
              if (d.length === 8) void buscar(d);
              else {
                ultima.current = "";
                setSituacao(null);
              }
            }}
          />
        </label>
        <label>
          Logradouro
          <input name="logradouro" value={logradouro} onChange={(e) => setLogradouro(e.target.value)} />
        </label>
        <label>
          Número
          <input name="numero" defaultValue={valor?.numero ?? undefined} />
        </label>
        <label>
          Bairro
          <input name="bairro" value={bairro} onChange={(e) => setBairro(e.target.value)} />
        </label>
        <label>
          Cidade
          <input name="cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} />
        </label>
        <label>
          UF
          <input
            name="uf"
            maxLength={2}
            value={uf}
            onChange={(e) => setUf(e.target.value.toUpperCase())}
          />
        </label>
      </Grid>
      {situacao && (
        <p role="status" className={`text-sm ${situacao.tipo === "erro" ? "text-red-600" : "text-muted"}`}>
          {situacao.texto}
        </p>
      )}
      <input type="hidden" name="latitude" value={coords.lat} />
      <input type="hidden" name="longitude" value={coords.lng} />
    </>
  );
}
