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
 * conta pelo email e ramifica em <b>vincular</b> (psicólogo já cadastrado) ou <b>rejeitar</b>
 * (e-mail não cadastrado / paciente / token inválido). Em caso de sucesso emite o Token de
 * Acesso da Aplicação com a indicação de perfil incompleto.
 *
 * <p>O e-mail precisa já existir como conta de psicólogo — cadastrada previamente (hoje via
 * SQL/pgweb, mesmo processo já usado pros psicólogos seed) — antes do primeiro login com Google;
 * o sistema SHALL NOT criar conta de psicólogo automaticamente para e-mail desconhecido (decisão
 * revertida em 2026-07-13, ver spec 001 REQ-006/Clarifications: o auto-cadastro original
 * permitia que qualquer conta Google virasse psicólogo sem nenhuma aprovação).
 *
 * <p>Cobre REQ-001, REQ-003, REQ-004, REQ-005, REQ-008, REQ-012, REQ-014
 * (e negativos REQ-NR002/003/004/005). O ID token do Google não é persistido nem reutilizado como
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

        User existing = userRepository.findByEmail(claims.email())
                .orElseThrow(() -> new ResponseStatusException(FORBIDDEN,
                        "Este e-mail ainda não tem acesso liberado. Peça para o administrador cadastrar sua conta."));

        User user = linkGoogleIdentity(existing, claims);

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
}
