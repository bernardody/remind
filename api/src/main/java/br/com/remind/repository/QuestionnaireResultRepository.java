package br.com.remind.repository;

import br.com.remind.domain.QuestionnaireAnswer;
import br.com.remind.domain.QuestionnaireResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface QuestionnaireResultRepository extends JpaRepository<QuestionnaireResult, Long> {
    Optional<QuestionnaireResult> findByQuestionnaireResponse(QuestionnaireAnswer questionnaireAnswer);
}