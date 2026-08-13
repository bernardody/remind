package br.com.remind.service.user;

import br.com.remind.controller.response.user.UserResponse;
import br.com.remind.domain.User;
import br.com.remind.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR;

@Service
public class AuthenticatedUserService {
    private final UserRepository userRepository;

    public AuthenticatedUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public String getEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Jwt jwt = (Jwt) authentication.getCredentials();
        return jwt.getClaim("email");
    }

    /**
     * Presente só quando o token autenticado é escopado a um convite ({@code scope=invite},
     * ver {@link br.com.remind.config.InviteScopedAuthorizationFilter}) — usado por serviços
     * de auto-serviço do paciente (sem patientId) que precisam restringir o próprio resultado
     * ao convite do escopo em vez de devolver tudo que o paciente tem.
     */
    public Optional<Long> getInviteScopedQuestionnaireId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Jwt jwt = (Jwt) authentication.getCredentials();

        if (!"invite".equals(jwt.getClaimAsString("scope"))) {
            return Optional.empty();
        }

        return Optional.ofNullable(jwt.getClaimAsString("questionnaireId")).map(Long::valueOf);
    }

    public User get() {
        return userRepository.findByEmail(getEmail())
                .orElseThrow(() -> new ResponseStatusException(INTERNAL_SERVER_ERROR, "Usuário não existe ou não está autenticado"));
    }
}
