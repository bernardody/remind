import { Info } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * Os eixos deste questionário (Uso compulsivo, Isolamento social etc.) são de
 * autoria própria, inspirados em critérios descritos na literatura sobre uso
 * problemático de redes sociais — não são a aplicação de um instrumento
 * validado (CARS/UCLA/BSMAS/SAS-SV/...), então não herdam os pontos de corte
 * publicados desses instrumentos. Precisa aparecer em toda tela que mostra
 * escore/faixa de risco, pra quem lê o resultado saber o que está vendo.
 */
export function ScoreDisclaimer() {
  return (
    <Alert>
      <Info />
      <AlertDescription>
        Este questionário é uma triagem própria do ReMind, com perguntas
        organizadas por eixo e inspiradas na literatura científica sobre uso
        problemático de redes sociais. As faixas "Baixo/Moderado/Alto" são um
        referencial descritivo interno, não um diagnóstico, e o resultado não
        substitui avaliação profissional.
      </AlertDescription>
    </Alert>
  );
}
