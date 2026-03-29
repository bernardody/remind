package br.com.remind.repository;

import br.com.remind.domain.Question;
import br.com.remind.domain.QuestionOption;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface QuestionOptionRepository extends JpaRepository<QuestionOption, Long> {
    Optional<QuestionOption> findByIdAndQuestionAndActiveTrue(Long id, Question question);
    List<QuestionOption> findByQuestionIdIn(List<Long> questionIds);
}