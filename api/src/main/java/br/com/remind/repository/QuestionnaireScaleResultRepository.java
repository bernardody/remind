package br.com.remind.repository;

import br.com.remind.domain.QuestionnaireResult;
import br.com.remind.domain.QuestionnaireScaleResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestionnaireScaleResultRepository extends JpaRepository<QuestionnaireScaleResult, Long> {
    List<QuestionnaireScaleResult> findByQuestionnaireResult(QuestionnaireResult questionnaireResult);
}
