package br.com.remind.repository;

import br.com.remind.domain.PatientQuestionResponse;
import br.com.remind.domain.QuestionnaireAnswer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PatientQuestionResponseRepository extends JpaRepository<PatientQuestionResponse, Long> {
    List<PatientQuestionResponse> findByQuestionnaireResponse(QuestionnaireAnswer questionnaireAnswer);
}