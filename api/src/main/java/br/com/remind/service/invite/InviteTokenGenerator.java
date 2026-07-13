package br.com.remind.service.invite;

import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

/**
 * Geração e hash do token opaco de convite (docs/specs/002-convite-questionario/PRD.md
 * §16). Só o hash é persistido — o valor em claro existe apenas em memória, entre a
 * geração e o envio por e-mail/exibição do link.
 */
@Component
public class InviteTokenGenerator {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    /** 256 bits de entropia, codificados em Base64 URL-safe (usável direto num link). */
    public String generateRawToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public String hash(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 não disponível na JVM", e);
        }
    }
}
