package br.com.remind.repository;

import br.com.remind.domain.Patient;
import br.com.remind.domain.Psychologist;
import br.com.remind.domain.Questionnaire;
import br.com.remind.domain.QuestionnaireAnswer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface QuestionnaireAnswerRepository extends JpaRepository<QuestionnaireAnswer, Long> {
    Page<QuestionnaireAnswer> findByQuestionnaire(Questionnaire questionnaire, Pageable pageable);
    Page<QuestionnaireAnswer> findByQuestionnaireAndPatient_Psychologist(
            Questionnaire questionnaire, Psychologist psychologist, Pageable pageable);
    Page<QuestionnaireAnswer> findByPatient(Patient patient, Pageable pageable);

    // @Query explícita: `answered_at` é snake_case, mesmo cuidado já documentado em
    // QuestionnaireInviteRepository#findByTokenHash pra não colidir com a derivação de nome do
    // Spring Data. Ordem desc — index 0 é sempre "a rodada mais recente" (docs/specs/
    // 003-relatorios-evolucao-longitudinal/PRD.md §4.3), usado tanto pro resultado "atual" quanto
    // pro histórico completo do relatório de evolução.
    @Query("""
            select qa from QuestionnaireAnswer qa
            where qa.patient = :patient and qa.questionnaire = :questionnaire
            order by qa.answered_at desc
            """)
    List<QuestionnaireAnswer> findAllByPatientAndQuestionnaireOrderByAnsweredAtDesc(
            @Param("patient") Patient patient, @Param("questionnaire") Questionnaire questionnaire);
}