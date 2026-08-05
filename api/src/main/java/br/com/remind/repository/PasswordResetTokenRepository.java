package br.com.remind.repository;

import br.com.remind.domain.PasswordResetToken;
import br.com.remind.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    // @Query explícita: o campo é `token_hash` (snake_case), o que colide com a derivação
    // de nome por convenção do Spring Data (mesmo motivo de QuestionnaireInviteRepository).
    @Query("select t from PasswordResetToken t where t.token_hash = :tokenHash")
    Optional<PasswordResetToken> findByTokenHash(@Param("tokenHash") String tokenHash);

    /**
     * Consumo atômico do token (mesmo padrão de
     * {@code QuestionnaireInviteRepository#consumeByTokenHash}): só marca {@code consumed_at}
     * se ainda não tiver sido consumido, não estiver expirado e estiver ativo — evita corrida
     * entre duas requisições com o mesmo token. Retorna quantas linhas foram afetadas (0 = não
     * consumiu; o chamador descobre o motivo consultando o registro).
     *
     * {@code now}/{@code today} vêm da JVM, não de {@code CURRENT_TIMESTAMP}/{@code CURRENT_DATE}
     * do Postgres — mesmo motivo documentado em QuestionnaireInviteRepository (timezone da sessão
     * do banco não é configurado neste projeto).
     */
    @Modifying(clearAutomatically = true)
    @Query("""
            update PasswordResetToken t
            set t.consumed_at = :now,
                t.updated_at = :today
            where t.token_hash = :tokenHash
              and t.consumed_at is null
              and t.expires_at > :now
              and t.active = true
            """)
    int consumeByTokenHash(@Param("tokenHash") String tokenHash, @Param("now") LocalDateTime now,
            @Param("today") LocalDate today);

    /**
     * Desativa tokens anteriores ainda vivos do mesmo usuário ao emitir um novo — evita que
     * múltiplos links de redefinição fiquem válidos ao mesmo tempo (mesmo espírito da rotação
     * de token usada no reenvio de convite).
     */
    @Modifying(clearAutomatically = true)
    @Query("""
            update PasswordResetToken t
            set t.active = false,
                t.updated_at = :today
            where t.user = :user
              and t.active = true
              and t.consumed_at is null
            """)
    void deactivateAllByUser(@Param("user") User user, @Param("today") LocalDate today);
}
