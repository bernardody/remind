/**
 * O `Scale.name` que vem do backend já é descritivo (ex. "Isolamento social",
 * "Sinais de dependência") — não é mais uma sigla de instrumento clínico (ver
 * migration_2026-07-22_renomeia_escalas.sql). Os itens de cada eixo são de
 * autoria própria, inspirados na literatura, não a tradução de um instrumento
 * validado; por isso o nome não pode mais alegar ser um instrumento com esse
 * nome (CARS/UCLA/SPI/etc.) sem que os itens realmente sejam esse instrumento.
 * Mantido como função (em vez de usar `scale.name` direto) só pra não obrigar
 * todo call-site a mudar de novo se um dia isso precisar de tratamento extra.
 */
export function getScaleDisplayName(scaleName: string): string {
  return scaleName;
}
