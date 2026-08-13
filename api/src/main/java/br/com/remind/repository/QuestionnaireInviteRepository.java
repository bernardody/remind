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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

public interface QuestionnaireInviteRepository extends JpaRepository<QuestionnaireInvite, Long> {

    // @Query explícita: o campo é `token_hash` (snake_case, como o resto do domínio), o
    // que colide com a derivação de nome por convenção do Spring Data (tenta interpretar
    // "_" como separador de caminho aninhado).
    @Query("select qi from QuestionnaireInvite qi where qi.token_hash = :tokenHash")
    Optional<QuestionnaireInvite> findByTokenHash(@Param("tokenHash") String tokenHash);

    Optional<QuestionnaireInvite> findByPatientAndQuestionnaireAndActiveTrue(Patient patient, Questionnaire questionnaire);

    Page<QuestionnaireInvite> findByPatientAndActiveTrue(Patient patient, Pageable pageable);

    /** Usado quando o chamador é uma sessão de convite (escopo restrito a 1 questionário) —
     * ver {@link br.com.remind.service.invite.ListMyInvitesService}. */
    Page<QuestionnaireInvite> findByPatientAndQuestionnaire_IdAndActiveTrue(
            Patient patient, Long questionnaireId, Pageable pageable);

    /**
     * Consumo atômico do token (INV-008, PRD §16): marca {@code OPENED}/{@code consumed_at}
     * sempre que o convite ainda não tiver sido respondido, não estiver expirado e estiver
     * ativo — evita corrida entre duas requisições com o mesmo token. Retorna quantas linhas
     * foram afetadas (0 = não consumiu; o chamador precisa então descobrir o motivo
     * consultando o registro).
     *
     * <p>Reabrir o mesmo link várias vezes é permitido enquanto o questionário não tiver sido
     * enviado (sessão de convite dura só 30min/{@code INVITE_EXPIRES_IN} — um paciente que
     * fecha a aba no meio do questionário precisa conseguir voltar pelo mesmo link, sem
     * depender de reenvio do psicólogo). O bloqueio definitivo de uso único acontece só quando
     * o convite já foi de fato respondido ({@code status = ANSWERED}, transição atômica
     * separada em {@link #markAnsweredIfLive}) — não mais quando {@code consumed_at} já
     * estava preenchido. {@code opened_at} preserva a 1ª abertura ({@code coalesce});
     * {@code consumed_at} sempre reflete a tentativa mais recente.
     *
     * {@code now}/{@code today} vêm da JVM (fixada em America/Sao_Paulo, ver
     * docker-entrypoint.sh) em vez de {@code CURRENT_TIMESTAMP}/{@code CURRENT_DATE} do
     * Postgres — essas funções nativas seguem o timezone da sessão do banco, que não é
     * configurado em lugar nenhum deste projeto, então divergiam da hora gravada em
     * {@code expires_at}/{@code sent_at} (JVM) em ambientes com o Postgres em UTC.
     */
    @Modifying(clearAutomatically = true)
    @Query("""
            update QuestionnaireInvite qi
            set qi.status = br.com.remind.enums.InviteStatus.OPENED,
                qi.opened_at = coalesce(qi.opened_at, :now),
                qi.consumed_at = :now,
                qi.updated_at = :today
            where qi.token_hash = :tokenHash
              and qi.status <> br.com.remind.enums.InviteStatus.ANSWERED
              and qi.expires_at > :now
              and qi.active = true
            """)
    int consumeByTokenHash(@Param("tokenHash") String tokenHash, @Param("now") LocalDateTime now,
            @Param("today") LocalDate today);

    /**
     * Consumo atômico do convite ao responder (docs/specs/003-relatorios-evolucao-longitudinal/PRD.md
     * §4.1) — condiciona a transição pra ANSWERED a um estado "vivo", igual em espírito a
     * {@link #consumeByTokenHash}, pra evitar que dois submits simultâneos do mesmo convite
     * criem duas respostas (variante do incidente R10, `.claude/specs/04-spec-aplicacao.md` §7).
     * Retorna 0 se não havia convite vivo (nunca convidado, já respondido, expirado ou revogado).
     */
    @Modifying(clearAutomatically = true)
    @Query("""
            update QuestionnaireInvite qi
            set qi.status = br.com.remind.enums.InviteStatus.ANSWERED,
                qi.updated_at = :today
            where qi.patient = :patient
              and qi.questionnaire = :questionnaire
              and qi.active = true
              and qi.status not in (
                  br.com.remind.enums.InviteStatus.ANSWERED,
                  br.com.remind.enums.InviteStatus.EXPIRED,
                  br.com.remind.enums.InviteStatus.REVOKED
              )
              and qi.expires_at > :now
            """)
    int markAnsweredIfLive(@Param("patient") Patient patient, @Param("questionnaire") Questionnaire questionnaire,
            @Param("now") LocalDateTime now, @Param("today") LocalDate today);
}
