package br.com.remind.service.admin;

import br.com.remind.domain.User;
import br.com.remind.enums.UserType;
import br.com.remind.repository.UserRepository;
import br.com.remind.service.password.RequestPasswordResetService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;

import static org.springframework.http.HttpStatus.CONFLICT;

/**
 * Cadastro de psicólogo por um admin (substitui o INSERT manual via pgweb). Cria só a linha em
 * {@code users} — {@code psychologists}/{@code addresses} continuam sendo criados pelo fluxo já
 * existente de conclusão de perfil ({@code CompleteProfileService}, disparado quando o próprio
 * psicólogo preenche CPF/telefone/endereço pela primeira vez).
 */
@RequiredArgsConstructor
@Service
public class CreatePsychologistService {

    private final UserRepository userRepository;
    private final RequestPasswordResetService requestPasswordResetService;

    @Transactional
    public void create(String name, String email) {
        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(CONFLICT, "Já existe uma conta com este e-mail.");
        }

        LocalDate today = LocalDate.now();
        User user = User.builder()
                .name(name)
                .email(email)
                .type(UserType.PSYCHOLOGIST)
                .password(null)
                .profileComplete(false)
                .created_at(today)
                .updated_at(today)
                .active(true)
                .build();

        userRepository.save(user);

        // Reaproveita 100% do mecanismo de token/e-mail do "esqueci minha senha" para dar ao
        // psicólogo o link de ativação — evita duplicar geração de token/envio de e-mail.
        requestPasswordResetService.request(email);
    }
}
