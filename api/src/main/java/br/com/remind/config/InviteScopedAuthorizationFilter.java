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
 * só autoriza ler/responder o questionário do convite (INV-012,
 * docs/specs/002-convite-questionario/PRD.md §16); qualquer outra operação retorna 403.
 *
 * <p>Mesmo padrão de {@link IncompleteProfileAuthorizationFilter}: executa após a
 * autenticação JWT e só age quando o token autenticado carrega o escopo restrito.
 */
public class InviteScopedAuthorizationFilter extends OncePerRequestFilter {

    private static final Pattern GET_QUESTIONNAIRE = Pattern.compile("^/questionarios/(\\d+)$");
    private static final Pattern ANSWER_QUESTIONNAIRE = Pattern.compile("^/questionarios/(\\d+)/responder$");
    // Auto-serviço do paciente (sem patientId, resolve pelo JWT) — a própria página do
    // wizard usa isso pra checar "já respondido?" antes de renderizar (ver
    // app/(app)/paciente/questionarios/[id]/responder/page.tsx no frontend). Sem essa
    // rota liberada, essa checagem recebe 403 em vez do 404 esperado e a página quebra.
    private static final Pattern MY_RESULT = Pattern.compile("^/questionarios/(\\d+)/resultado$");
    // Idem: a página do wizard trocou a checagem de "já respondido?" de MY_RESULT pra este
    // endpoint (commit 7200f730, 2026-07-17) sem essa rota jamais ter sido liberada aqui —
    // toda sessão de convite (o fluxo padrão de resposta) recebia 403 não tratado no
    // carregamento da página. `ListMyInvitesService` filtra o resultado pra só o convite
    // do próprio escopo, então liberar aqui não vaza os outros convites do paciente.
    private static final Pattern LIST_MY_INVITES = Pattern.compile("^/questionarios/convites$");

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

        if ("GET".equals(method) && matchesQuestionnaireId(GET_QUESTIONNAIRE, path, questionnaireId)) {
            return true;
        }

        if ("GET".equals(method) && matchesQuestionnaireId(MY_RESULT, path, questionnaireId)) {
            return true;
        }

        if ("GET".equals(method) && LIST_MY_INVITES.matcher(path).matches()) {
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
