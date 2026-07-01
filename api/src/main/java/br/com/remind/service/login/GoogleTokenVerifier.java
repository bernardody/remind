package br.com.remind.service.login;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;

import static org.springframework.http.HttpStatus.UNAUTHORIZED;

/**
 * Valida a autenticidade de um <b>ID Token</b> do Google — assinatura (via JWKS público do
 * Google), emissor, audiência (== {@code google.client-id}) e expiração — reutilizando a lib
 * Nimbus já no classpath (AD-001). Tokens inválidos/expirados são rejeitados antes de qualquer
 * confiança em seus claims (REQ-002, REQ-003, REQ-NR001).
 */
@Component
public class GoogleTokenVerifier {

    private static final String GOOGLE_JWKS_URI = "https://www.googleapis.com/oauth2/v3/certs";
    private static final Set<String> GOOGLE_ISSUERS = Set.of(
            "https://accounts.google.com",
            "accounts.google.com"
    );

    private final JwtDecoder decoder;

    @Autowired
    public GoogleTokenVerifier(@Value("${google.client-id}") String clientId) {
        this(buildGoogleDecoder(clientId));
    }

    /** Construtor visível para testes: permite injetar um decoder com chaves controladas. */
    GoogleTokenVerifier(JwtDecoder decoder) {
        this.decoder = decoder;
    }

    /**
     * Valida o ID token e devolve os claims confiáveis.
     *
     * @param idToken o ID token (JWT RS256) emitido pelo Google
     * @return claims confiáveis ({@code sub}, {@code email}, {@code email_verified}, {@code name})
     * @throws ResponseStatusException 401 se o token for ausente, malformado, com assinatura,
     *                                 emissor, audiência inválidos ou expirado
     */
    public GoogleClaims verify(String idToken) {
        if (idToken == null || idToken.isBlank()) {
            throw new ResponseStatusException(UNAUTHORIZED, "ID token do Google ausente.");
        }

        Jwt jwt;
        try {
            jwt = decoder.decode(idToken);
        } catch (JwtException e) {
            throw new ResponseStatusException(UNAUTHORIZED, "ID token do Google inválido ou expirado.");
        }

        return new GoogleClaims(
                jwt.getSubject(),
                jwt.getClaimAsString("email"),
                readEmailVerified(jwt),
                jwt.getClaimAsString("name")
        );
    }

    private static boolean readEmailVerified(Jwt jwt) {
        Object value = jwt.getClaim("email_verified");
        if (value instanceof Boolean bool) {
            return bool;
        }
        return Boolean.parseBoolean(String.valueOf(value));
    }

    private static NimbusJwtDecoder buildGoogleDecoder(String clientId) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri(GOOGLE_JWKS_URI).build();
        decoder.setJwtValidator(validators(clientId));
        return decoder;
    }

    /** Validadores explícitos de expiração, emissor e audiência (Risk R-02). */
    public static OAuth2TokenValidator<Jwt> validators(String clientId) {
        return new DelegatingOAuth2TokenValidator<>(
                new JwtTimestampValidator(),
                issuerValidator(),
                audienceValidator(clientId)
        );
    }

    private static OAuth2TokenValidator<Jwt> issuerValidator() {
        return jwt -> GOOGLE_ISSUERS.contains(jwt.getClaimAsString("iss"))
                ? OAuth2TokenValidatorResult.success()
                : OAuth2TokenValidatorResult.failure(
                new OAuth2Error("invalid_issuer", "Emissor do ID token não é o Google", null));
    }

    private static OAuth2TokenValidator<Jwt> audienceValidator(String clientId) {
        return jwt -> {
            List<String> audience = jwt.getAudience();
            return audience != null && audience.contains(clientId)
                    ? OAuth2TokenValidatorResult.success()
                    : OAuth2TokenValidatorResult.failure(
                    new OAuth2Error("invalid_audience", "Audiência do ID token não corresponde ao client-id", null));
        };
    }
}
