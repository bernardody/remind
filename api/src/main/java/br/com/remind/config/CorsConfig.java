package br.com.remind.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class CorsConfig {

    /**
     * Lista de origens permitidas, por ambiente (ver PRODUCTION_AUDIT.md B-SEC-CORS —
     * antes disso era {@code addAllowedOrigin("*")}, aberto pra qualquer site). Hoje nenhum
     * JS de browser chama esta API diretamente entre origens (o frontend usa um BFF same-origin,
     * `app/api/[...proxy]/route.ts`), mas restringir aqui é defesa em profundidade caso isso mude
     * ou algum endpoint futuro seja chamado direto do browser.
     */
    @Value("${remind.cors.allowed-origins}")
    private List<String> allowedOrigins;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(allowedOrigins);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
