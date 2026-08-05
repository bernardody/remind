package br.com.remind.service.password;

import br.com.remind.domain.User;
import br.com.remind.repository.UserRepository;
import br.com.remind.service.user.AuthenticatedUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;

import static org.springframework.http.HttpStatus.UNAUTHORIZED;

/**
 * Troca a senha do próprio usuário autenticado (tela de perfil/configurações). Se a conta ainda
 * não tem senha (nasceu por login Google, ou por cadastro de admin antes da primeira ativação),
 * não há o que comparar — pula a checagem de {@code currentPassword} (mesmo caso tratado em
 * {@code LoginController}).
 */
@RequiredArgsConstructor
@Service
public class ChangePasswordService {

    private final AuthenticatedUserService authenticatedUserService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public void change(String currentPassword, String newPassword) {
        User user = authenticatedUserService.get();

        if (user.getPassword() != null
                && !passwordEncoder.matches(currentPassword == null ? "" : currentPassword, user.getPassword())) {
            throw new ResponseStatusException(UNAUTHORIZED, "Senha atual incorreta.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setUpdated_at(LocalDate.now());
        userRepository.save(user);
    }
}
