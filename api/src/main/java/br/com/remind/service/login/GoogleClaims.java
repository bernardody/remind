package br.com.remind.service.login;

/**
 * Claims confiáveis extraídos de um <b>ID Token</b> do Google já validado
 * (assinatura, emissor, audiência e expiração conferidos).
 */
public record GoogleClaims(String sub, String email, boolean emailVerified, String name) {
}
