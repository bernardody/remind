package br.com.remind.repository;

import br.com.remind.domain.Question;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long> {

    List<Question> findByQuestionnaireId(Long questionnaireId);
}
