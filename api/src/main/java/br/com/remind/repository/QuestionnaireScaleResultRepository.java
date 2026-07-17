package br.com.remind.repository;

import br.com.remind.domain.QuestionnaireResult;
import br.com.remind.domain.QuestionnaireScaleResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface QuestionnaireScaleResultRepository extends JpaRepository<QuestionnaireScaleResult, Long> {
    List<QuestionnaireScaleResult> findByQuestionnaireResult(QuestionnaireResult questionnaireResult);

    // Busca em lote pro relatório de evolução (docs/specs/003-relatorios-evolucao-longitudinal/
    // PRD.md §4.3) — evita 1 query por rodada quando o paciente tem várias aplicações.
    List<QuestionnaireScaleResult> findByQuestionnaireResultIn(Collection<QuestionnaireResult> questionnaireResults);
}
