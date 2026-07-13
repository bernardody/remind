package br.com.remind.repository;

import br.com.remind.domain.Patient;
import br.com.remind.domain.Questionnaire;
import br.com.remind.domain.QuestionnaireInvite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface QuestionnaireInviteRepository extends JpaRepository<QuestionnaireInvite, Long> {

    // @Query explícita: o campo é `token_hash` (snake_case, como o resto do domínio), o
    // que colide com a derivação de nome por convenção do Spring Data (tenta interpretar
    // "_" como separador de caminho aninhado).
    @Query("select qi from QuestionnaireInvite qi where qi.token_hash = :tokenHash")
    Optional<QuestionnaireInvite> findByTokenHash(@Param("tokenHash") String tokenHash);

    Optional<QuestionnaireInvite> findByPatientAndQuestionnaireAndActiveTrue(Patient patient, Questionnaire questionnaire);
}
