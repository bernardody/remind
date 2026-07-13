package br.com.remind.config;

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
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Um Token de Acesso emitido a partir de um <b>convite de questionário</b> (claim
 * {@code scope=invite} — ver {@link br.com.remind.service.login.AccessTokenService#generateInviteScoped})
 * só autoriza ler/responder o questionário do convite e definir a senha do próprio
 * paciente (INV-012, docs/specs/002-convite-questionario/PRD.md §16); qualquer outra
 * operação retorna 403.
 *
 * <p>Mesmo padrão de {@link IncompleteProfileAuthorizationFilter}: executa após a
 * autenticação JWT e só age quando o token autenticado carrega o escopo restrito.
 */
public class InviteScopedAuthorizationFilter extends OncePerRequestFilter {

    private static final Pattern GET_QUESTIONNAIRE = Pattern.compile("^/questionarios/(\\d+)$");
    private static final Pattern ANSWER_QUESTIONNAIRE = Pattern.compile("^/questionarios/(\\d+)/responder$");
    private static final String SET_OWN_PASSWORD_PATH = "/pacientes/me/senha";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        Optional<String> scopedQuestionnaireId = readInviteScopeQuestionnaireId();

        if (scopedQuestionnaireId.isPresent() && !isAllowedForInviteScope(request, scopedQuestionnaireId.get())) {
            writeForbidden(request, response);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private Optional<String> readInviteScopeQuestionnaireId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof Jwt jwt)) {
            return Optional.empty();
        }

        if (!"invite".equals(jwt.getClaimAsString("scope"))) {
            return Optional.empty();
        }

        return Optional.ofNullable(jwt.getClaimAsString("questionnaireId"));
    }

    private boolean isAllowedForInviteScope(HttpServletRequest request, String questionnaireId) {
        String method = request.getMethod();
        String path = request.getRequestURI();

        if ("PUT".equals(method) && SET_OWN_PASSWORD_PATH.equals(path)) {
            return true;
        }

        if ("GET".equals(method) && matchesQuestionnaireId(GET_QUESTIONNAIRE, path, questionnaireId)) {
            return true;
        }

        return "POST".equals(method) && matchesQuestionnaireId(ANSWER_QUESTIONNAIRE, path, questionnaireId);
    }

    private boolean matchesQuestionnaireId(Pattern pattern, String path, String questionnaireId) {
        Matcher matcher = pattern.matcher(path);
        return matcher.matches() && matcher.group(1).equals(questionnaireId);
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
                        "Este acesso é restrito ao questionário do convite.",
                        request.getRequestURI()
                );

        response.getWriter().write(json);
    }
}
