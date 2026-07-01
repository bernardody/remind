package br.com.remind.service.login;

import br.com.remind.controller.response.login.LoginResponse;
import br.com.remind.domain.User;
import br.com.remind.enums.UserType;
import br.com.remind.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;

import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

/**
 * Orquestra o login via Google: valida o ID token, confere {@code email_verified}, localiza a
 * conta pelo email e ramifica em <b>criar</b> (Conta Pendente), <b>vincular</b> (psicólogo
 * existente) ou <b>rejeitar</b> (paciente / token inválido). Em caso de sucesso emite o Token de
 * Acesso da Aplicação com a indicação de perfil incompleto.
 *
 * <p>Cobre REQ-001, REQ-003, REQ-004, REQ-005, REQ-006, REQ-008, REQ-012, REQ-014
 * (e negativos REQ-NR002/003/004). O ID token do Google não é persistido nem reutilizado como
 * token de sessão (REQ-NR004).
 */
@Service
@RequiredArgsConstructor
public class GoogleLoginService {

    private final GoogleTokenVerifier googleTokenVerifier;
    private final UserRepository userRepository;
    private final AccessTokenService accessTokenService;

    @Transactional
    public LoginResponse login(String idToken) {
        GoogleClaims claims = googleTokenVerifier.verify(idToken);

        if (!claims.emailVerified()) {
            throw new ResponseStatusException(UNAUTHORIZED, "E-mail do Google não verificado.");
        }

        User user = userRepository.findByEmail(claims.email())
                .map(existing -> linkGoogleIdentity(existing, claims))
                .orElseGet(() -> createPendingPsychologist(claims));

        String token = accessTokenService.generate(user).getTokenValue();

        return new LoginResponse(
                token,
                AccessTokenService.EXPIRES_IN,
                user.getType(),
                Boolean.TRUE.equals(user.getProfileComplete())
        );
    }

    /**
     * Vincula a Identidade Google a um psicólogo existente sem sobrescrever seus dados (REQ-014).
     * Pacientes são rejeitados com 403 (REQ-005, REQ-NR003).
     */
    private User linkGoogleIdentity(User existing, GoogleClaims claims) {
        if (existing.getType() != UserType.PSYCHOLOGIST) {
            throw new ResponseStatusException(FORBIDDEN, "Apenas psicólogos podem usar o login do Google.");
        }

        if (existing.getGoogleSub() == null) {
            existing.setGoogleSub(claims.sub());
            existing.setUpdated_at(LocalDate.now());
            userRepository.save(existing);
        }

        return existing;
    }

    /**
     * Cria uma Conta Pendente de psicólogo (sem senha/CPF/telefone), {@code profile_complete=false}
     * e {@code google_sub} setado (REQ-006, REQ-012).
     */
    private User createPendingPsychologist(GoogleClaims claims) {
        LocalDate now = LocalDate.now();

        User pending = User.builder()
                .name(claims.name())
                .email(claims.email())
                .googleSub(claims.sub())
                .type(UserType.PSYCHOLOGIST)
                .profileComplete(false)
                .created_at(now)
                .updated_at(now)
                .active(true)
                .build();

        return userRepository.save(pending);
    }
}
