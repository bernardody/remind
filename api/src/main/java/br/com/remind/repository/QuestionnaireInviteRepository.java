package br.com.remind.repository;

import br.com.remind.domain.Patient;
import br.com.remind.domain.Questionnaire;
import br.com.remind.domain.QuestionnaireInvite;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
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

    Page<QuestionnaireInvite> findByPatientAndActiveTrue(Patient patient, Pageable pageable);

    /**
     * Consumo atômico do token (INV-008, PRD §16): só marca {@code OPENED}/{@code consumed_at}
     * se ainda não tiver sido consumido, não estiver expirado e estiver ativo — evita corrida
     * entre duas requisições com o mesmo token. Retorna quantas linhas foram afetadas (0 = não
     * consumiu; o chamador precisa então descobrir o motivo consultando o registro).
     */
    @Modifying(clearAutomatically = true)
    @Query("""
            update QuestionnaireInvite qi
            set qi.status = br.com.remind.enums.InviteStatus.OPENED,
                qi.opened_at = CURRENT_TIMESTAMP,
                qi.consumed_at = CURRENT_TIMESTAMP,
                qi.updated_at = CURRENT_DATE
            where qi.token_hash = :tokenHash
              and qi.consumed_at is null
              and qi.expires_at > CURRENT_TIMESTAMP
              and qi.active = true
            """)
    int consumeByTokenHash(@Param("tokenHash") String tokenHash);
}
