package br.com.remind.service.login;

import br.com.remind.domain.User;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

class AccessTokenServiceTest {

    private AccessTokenService accessTokenService;

    @BeforeEach
    void setUp() throws Exception {
        var generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        var keyPair = generator.generateKeyPair();
        RSAPublicKey publicKey = (RSAPublicKey) keyPair.getPublic();
        RSAPrivateKey privateKey = (RSAPrivateKey) keyPair.getPrivate();

        RSAKey jwk = new RSAKey.Builder(publicKey).privateKey(privateKey).build();
        JwtEncoder encoder = new NimbusJwtEncoder(new ImmutableJWKSet<>(new JWKSet(jwk)));
        accessTokenService = new AccessTokenService(encoder);
    }

    @Test
    void generate_producesTokenWithExpectedClaimsAndExpiration() {
        User user = User.builder()
                .name("Camila Ferreira Nogueira")
                .email("camila@example.com")
                .build();

        Jwt jwt = accessTokenService.generate(user);

        assertThat(jwt.getClaimAsString("iss")).isEqualTo("tcc");
        assertThat(jwt.getSubject()).isEqualTo("Camila Ferreira Nogueira");
        assertThat(jwt.getClaimAsString("email")).isEqualTo("camila@example.com");
        assertThat(jwt.getIssuedAt()).isNotNull();
        assertThat(jwt.getExpiresAt()).isNotNull();

        long lifetimeSeconds = jwt.getExpiresAt().getEpochSecond() - jwt.getIssuedAt().getEpochSecond();
        assertThat(lifetimeSeconds).isEqualTo(AccessTokenService.EXPIRES_IN);
        assertThat(jwt.getExpiresAt()).isAfter(Instant.now());
    }
}
