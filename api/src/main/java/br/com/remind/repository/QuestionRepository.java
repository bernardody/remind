package br.com.remind.repository;

import br.com.remind.domain.Question;
import br.com.remind.domain.Questionnaire;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface QuestionRepository extends JpaRepository<Question, Long> {
    Optional<Question> findByIdAndQuestionnaireAndActiveTrue(Long id, Questionnaire questionnaire);
    Long countByQuestionnaireAndActiveTrue(Questionnaire questionnaire);
    List<Question> findByQuestionnaireId(Long questionnaireId);
}