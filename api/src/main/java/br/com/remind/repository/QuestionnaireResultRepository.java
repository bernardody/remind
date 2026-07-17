package br.com.remind.repository;

import br.com.remind.domain.QuestionnaireAnswer;
import br.com.remind.domain.QuestionnaireResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface QuestionnaireResultRepository extends JpaRepository<QuestionnaireResult, Long> {
    Optional<QuestionnaireResult> findByQuestionnaireResponse(QuestionnaireAnswer questionnaireAnswer);

    // Busca em lote pro relatório de evolução (docs/specs/003-relatorios-evolucao-longitudinal/
    // PRD.md §4.3) — evita 1 query por rodada quando o paciente tem várias aplicações.
    List<QuestionnaireResult> findByQuestionnaireResponseIn(Collection<QuestionnaireAnswer> questionnaireAnswers);
}