package br.com.remind.config;

import br.com.remind.domain.User;
import br.com.remind.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Enquanto uma conta de psicólogo está com <b>Perfil Incompleto</b> ({@code profile_complete=false}),
 * o Token de Acesso só autoriza a <b>Conclusão de Perfil</b> e a <b>leitura do próprio perfil</b>;
 * qualquer outra operação protegida retorna 403 (REQ-013).
 *
 * <p>Executa após a autenticação JWT (registrado em {@link SecurityConfig}). Requisições sem token
 * (endpoints públicos ou 401) não são afetadas: só age quando há um {@link Jwt} autenticado.
 */
public class IncompleteProfileAuthorizationFilter extends OncePerRequestFilter {

    /** Rotas liberadas mesmo com perfil incompleto: conclusão e leitura do próprio perfil. */
    private static final List<Map.Entry<String, String>> ALLOWED_ROUTES = List.of(
            Map.entry("PUT", "/psychologists/me/profile"),
            Map.entry("GET", "/psychologists/me/profile")
    );

    private final UserRepository userRepository;

    public IncompleteProfileAuthorizationFilter(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        if (isIncompleteProfile() && !isAllowedForIncompleteProfile(request)) {
            writeForbidden(request, response);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean isIncompleteProfile() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof Jwt jwt)) {
            return false;
        }

        String email = jwt.getClaimAsString("email");
        if (email == null) {
            return false;
        }

        Optional<User> user = userRepository.findByEmail(email);
        return user.isPresent() && !Boolean.TRUE.equals(user.get().getProfileComplete());
    }

    private boolean isAllowedForIncompleteProfile(HttpServletRequest request) {
        String method = request.getMethod();
        String path = request.getRequestURI();
        return ALLOWED_ROUTES.stream()
                .anyMatch(route -> route.getKey().equals(method) && route.getValue().equals(path));
    }

    private void writeForbidden(HttpServletRequest request, HttpServletResponse response) throws IOException {
        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        String json = """
                {"timestamp":"%s","status":%d,"error":"%s","message":"%s","path":"%s"}"""
                .formatted(
                        LocalDateTime.now(),
                        HttpStatus.FORBIDDEN.value(),
                        HttpStatus.FORBIDDEN.getReasonPhrase(),
                        "Conclua seu perfil para acessar esta operação.",
                        request.getRequestURI()
                );

        response.getWriter().write(json);
    }
}
