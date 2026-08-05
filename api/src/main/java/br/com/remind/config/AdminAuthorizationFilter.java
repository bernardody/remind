package br.com.remind.config;

import br.com.remind.domain.User;
import br.com.remind.enums.UserType;
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
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Restringe {@code /admin/**} a usuários {@code UserType.ADMIN} (cadastro de psicólogo via
 * {@code AdminController}). Mesmo molde de {@link IncompleteProfileAuthorizationFilter}: age
 * depois da autenticação JWT, só quando há um {@link Jwt} autenticado — requisições sem token já
 * caem em 401 antes de chegar aqui.
 */
public class AdminAuthorizationFilter extends OncePerRequestFilter {

    private static final String ADMIN_PATH_PATTERN = "/admin/**";

    private final UserRepository userRepository;
    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    public AdminAuthorizationFilter(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        if (pathMatcher.match(ADMIN_PATH_PATTERN, request.getRequestURI()) && !isAdmin()) {
            writeForbidden(request, response);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean isAdmin() {
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
        return user.isPresent() && user.get().getType() == UserType.ADMIN;
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
                        "Acesso restrito a administradores.",
                        request.getRequestURI()
                );

        response.getWriter().write(json);
    }
}
