package br.com.remind.service.password;

import br.com.remind.domain.User;
import br.com.remind.repository.UserRepository;
import br.com.remind.service.user.AuthenticatedUserService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ChangePasswordServiceTest {

    @Mock
    private AuthenticatedUserService authenticatedUserService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private ChangePasswordService changePasswordService;

    @Test
    void change_withCorrectCurrentPassword_encodesAndSavesNewPassword() {
        User user = User.builder().id(1L).password("bcrypt-atual").build();
        when(authenticatedUserService.get()).thenReturn(user);
        when(passwordEncoder.matches("senhaAtual", "bcrypt-atual")).thenReturn(true);
        when(passwordEncoder.encode("novaSenha123")).thenReturn("bcrypt-nova");

        changePasswordService.change("senhaAtual", "novaSenha123");

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().getPassword()).isEqualTo("bcrypt-nova");
    }

    @Test
    void change_withWrongCurrentPassword_throwsUnauthorized_withoutSaving() {
        User user = User.builder().id(1L).password("bcrypt-atual").build();
        when(authenticatedUserService.get()).thenReturn(user);
        when(passwordEncoder.matches("senhaErrada", "bcrypt-atual")).thenReturn(false);

        assertThatThrownBy(() -> changePasswordService.change("senhaErrada", "novaSenha123"))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode().value())
                .isEqualTo(401);

        verify(userRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void change_whenAccountHasNoPasswordYet_skipsCurrentPasswordCheck() {
        // Conta nascida via Google (ou recém-criada por um admin, ainda não ativada).
        User user = User.builder().id(1L).password(null).build();
        when(authenticatedUserService.get()).thenReturn(user);
        when(passwordEncoder.encode("novaSenha123")).thenReturn("bcrypt-nova");

        changePasswordService.change(null, "novaSenha123");

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().getPassword()).isEqualTo("bcrypt-nova");
    }
}
