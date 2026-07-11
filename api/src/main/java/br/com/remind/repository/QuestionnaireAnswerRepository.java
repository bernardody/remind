package br.com.remind.repository;

import br.com.remind.domain.Patient;
import br.com.remind.domain.Psychologist;
import br.com.remind.domain.Questionnaire;
import br.com.remind.domain.QuestionnaireAnswer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface QuestionnaireAnswerRepository extends JpaRepository<QuestionnaireAnswer, Long> {
    Page<QuestionnaireAnswer> findByQuestionnaire(Questionnaire questionnaire, Pageable pageable);
    Page<QuestionnaireAnswer> findByQuestionnaireAndPatient_Psychologist(
            Questionnaire questionnaire, Psychologist psychologist, Pageable pageable);
    Page<QuestionnaireAnswer> findByPatient(Patient patient, Pageable pageable);
    Optional<QuestionnaireAnswer> findByPatientAndQuestionnaire(Patient patient, Questionnaire questionnaire);
}