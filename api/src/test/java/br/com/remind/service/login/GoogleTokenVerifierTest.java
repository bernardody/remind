package br.com.remind.service.login;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.web.server.ResponseStatusException;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.time.Instant;
import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class GoogleTokenVerifierTest {

    private static final String CLIENT_ID = "test-client-id.apps.googleusercontent.com";

    private static KeyPair googleKeyPair;
    private static KeyPair attackerKeyPair;
    private static GoogleTokenVerifier verifier;

    @BeforeAll
    static void setUp() throws Exception {
        googleKeyPair = generateKeyPair();
        attackerKeyPair = generateKeyPair();

        // Decoder de teste: valida com a chave pública "do Google" + validadores reais.
        NimbusJwtDecoder decoder = NimbusJwtDecoder
                .withPublicKey((RSAPublicKey) googleKeyPair.getPublic())
                .build();
        decoder.setJwtValidator(GoogleTokenVerifier.validators(CLIENT_ID));
        verifier = new GoogleTokenVerifier((JwtDecoder) decoder);
    }

    private static KeyPair generateKeyPair() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        return generator.generateKeyPair();
    }

    private String signWith(RSAPrivateKey key, JWTClaimsSet claims) throws Exception {
        SignedJWT jwt = new SignedJWT(new JWSHeader(JWSAlgorithm.RS256), claims);
        jwt.sign(new RSASSASigner(key));
        return jwt.serialize();
    }

    private JWTClaimsSet.Builder validClaims() {
        return new JWTClaimsSet.Builder()
                .issuer("https://accounts.google.com")
                .audience(CLIENT_ID)
                .subject("google-sub-123")
                .claim("email", "psicologo@gmail.com")
                .claim("email_verified", true)
                .claim("name", "Psicólogo Teste")
                .issueTime(new Date())
                .expirationTime(Date.from(Instant.now().plusSeconds(300)));
    }

    @Test
    void verify_validToken_returnsTrustedClaims() throws Exception {
        String token = signWith((RSAPrivateKey) googleKeyPair.getPrivate(), validClaims().build());

        GoogleClaims claims = verifier.verify(token);

        assertThat(claims.sub()).isEqualTo("google-sub-123");
        assertThat(claims.email()).isEqualTo("psicologo@gmail.com");
        assertThat(claims.emailVerified()).isTrue();
        assertThat(claims.name()).isEqualTo("Psicólogo Teste");
    }

    @Test
    void verify_wrongAudience_isRejected() throws Exception {
        String token = signWith((RSAPrivateKey) googleKeyPair.getPrivate(),
                validClaims().audience("other-app-id").build());

        assertThatThrownBy(() -> verifier.verify(token))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode().value())
                .isEqualTo(401);
    }

    @Test
    void verify_wrongIssuer_isRejected() throws Exception {
        String token = signWith((RSAPrivateKey) googleKeyPair.getPrivate(),
                validClaims().issuer("https://evil.example.com").build());

        assertThatThrownBy(() -> verifier.verify(token))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void verify_expiredToken_isRejected() throws Exception {
        String token = signWith((RSAPrivateKey) googleKeyPair.getPrivate(),
                validClaims()
                        .issueTime(Date.from(Instant.now().minusSeconds(600)))
                        .expirationTime(Date.from(Instant.now().minusSeconds(300)))
                        .build());

        assertThatThrownBy(() -> verifier.verify(token))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void verify_invalidSignature_isRejected_withoutExposingClaims() throws Exception {
        // Assinado por chave do atacante; decoder usa a chave "do Google".
        String token = signWith((RSAPrivateKey) attackerKeyPair.getPrivate(), validClaims().build());

        assertThatThrownBy(() -> verifier.verify(token))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode().value())
                .isEqualTo(401);
    }

    @Test
    void verify_blankToken_isRejected() {
        assertThatThrownBy(() -> verifier.verify("   "))
                .isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> verifier.verify("not-a-jwt"))
                .isInstanceOf(ResponseStatusException.class);
    }
}
