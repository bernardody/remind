/**
 * Explicação curta do que cada escala mede, pra exibir ao lado da sigla
 * (psicólogos não decoram todas as siglas de cabeça). Chave é o `Scale.name`
 * exato vindo do backend (tabela `scales`) — ver api/data/insert.sql e
 * api/data/migration_2026-07-16_novas_escalas.sql.
 */
const SCALE_DESCRIPTIONS: Record<string, string> = {
  CARS: "adição a redes sociais",
  UCLA: "solidão",
  SPI: "uso problemático da internet",
  SISES: "autoestima",
  BSMAS: "uso excessivo de redes sociais",
  "SMD Scale": "uso disfuncional de redes sociais",
  FoMOs: "medo de ficar por fora",
  "SAS-SV": "dependência de smartphone",
};

/** "SPI" -> "SPI (uso problemático da internet)"; sigla desconhecida volta como veio. */
export function getScaleDisplayName(scaleName: string): string {
  const description = SCALE_DESCRIPTIONS[scaleName];
  return description ? `${scaleName} (${description})` : scaleName;
}
