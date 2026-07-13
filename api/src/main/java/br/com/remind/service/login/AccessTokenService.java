package br.com.remind.service.login;

import br.com.remind.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Instant;

/**
 * Emissão centralizada do <b>Token de Acesso da Aplicação</b> (JWT próprio).
 *
 * <p>Consumido tanto pelo login por senha ({@code /login}) quanto pelo login Google
 * ({@code /login/google}), garantindo tokens com claims e expiração idênticos (REQ-007).
 */
@Service
@RequiredArgsConstructor
public class AccessTokenService {

    /** Validade do token de acesso, em segundos. */
    public static final long EXPIRES_IN = 600L;

    /**
     * Validade do token de escopo restrito emitido ao consumir um convite de questionário
     * (docs/specs/002-convite-questionario/PRD.md §16) — mais longo que o login normal
     * porque precisa durar o suficiente para completar um wizard de várias telas, mas
     * curto porque autoriza só o questionário do convite (INV-012).
     */
    public static final long INVITE_EXPIRES_IN = 1800L;

    private static final String ISSUER = "tcc";

    private final JwtEncoder jwtEncoder;

    /**
     * Emite o token de acesso para o usuário informado.
     *
     * @param user usuário autenticado (por senha ou Google)
     * @return o JWT emitido (use {@link Jwt#getTokenValue()} para o valor serializado)
     */
    public Jwt generate(User user) {
        Instant now = Instant.now();

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(ISSUER)
                .subject(user.getName())
                .issuedAt(now)
                .expiresAt(now.plusSeconds(EXPIRES_IN))
                .claim("email", user.getEmail())
                .build();

        return jwtEncoder.encode(JwtEncoderParameters.from(claims));
    }

    /**
     * Emite o token de escopo restrito trocado por um token de convite consumido
     * (INV-008). Autoriza só o questionário indicado — ver {@code InviteScopedAuthorizationFilter}.
     *
     * @param patient        o paciente dono do convite
     * @param questionnaireId o questionário ao qual o acesso fica restrito
     */
    public Jwt generateInviteScoped(User patient, Long questionnaireId) {
        Instant now = Instant.now();

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(ISSUER)
                .subject(patient.getName())
                .issuedAt(now)
                .expiresAt(now.plusSeconds(INVITE_EXPIRES_IN))
                .claim("email", patient.getEmail())
                .claim("scope", "invite")
                .claim("questionnaireId", String.valueOf(questionnaireId))
                .build();

        return jwtEncoder.encode(JwtEncoderParameters.from(claims));
    }
}
