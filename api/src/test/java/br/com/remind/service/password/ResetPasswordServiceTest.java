package br.com.remind.service.password;

import br.com.remind.domain.PasswordResetToken;
import br.com.remind.domain.User;
import br.com.remind.repository.PasswordResetTokenRepository;
import br.com.remind.repository.UserRepository;
import br.com.remind.service.invite.InviteTokenGenerator;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ResetPasswordServiceTest {

    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private InviteTokenGenerator inviteTokenGenerator;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private ResetPasswordService resetPasswordService;

    private PasswordResetToken tokenWith(LocalDateTime expiresAt, LocalDateTime consumedAt, boolean active) {
        User user = User.builder().id(1L).name("Psicólogo").email("psi@example.com").build();
        return PasswordResetToken.builder()
                .user(user)
                .token_hash("hash")
                .expires_at(expiresAt)
                .consumed_at(consumedAt)
                .active(active)
                .build();
    }

    @Test
    void reset_withValidToken_encodesAndSavesNewPassword() {
        when(inviteTokenGenerator.hash(anyString())).thenReturn("hash");
        when(passwordResetTokenRepository.findByTokenHash("hash"))
                .thenReturn(Optional.of(tokenWith(LocalDateTime.now().plusMinutes(30), null, true)));
        when(passwordResetTokenRepository.consumeByTokenHash(anyString(), any(), any())).thenReturn(1);
        when(passwordEncoder.encode("novaSenha123")).thenReturn("encoded");

        resetPasswordService.reset("raw-token", "novaSenha123");

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        assertThat(userCaptor.getValue().getPassword()).isEqualTo("encoded");
    }

    @Test
    void reset_withUnknownToken_throwsNotFound() {
        when(inviteTokenGenerator.hash(anyString())).thenReturn("hash-desconhecido");
        when(passwordResetTokenRepository.findByTokenHash("hash-desconhecido")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> resetPasswordService.reset("raw-token", "novaSenha123"))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode().value())
                .isEqualTo(404);

        verify(userRepository, never()).save(any());
    }

    @Test
    void reset_withExpiredToken_throwsGone_withoutSavingPassword() {
        when(inviteTokenGenerator.hash(anyString())).thenReturn("hash");
        when(passwordResetTokenRepository.findByTokenHash("hash"))
                .thenReturn(Optional.of(tokenWith(LocalDateTime.now().minusMinutes(1), null, true)));
        when(passwordResetTokenRepository.consumeByTokenHash(anyString(), any(), any())).thenReturn(0);

        assertThatThrownBy(() -> resetPasswordService.reset("raw-token", "novaSenha123"))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode().value())
                .isEqualTo(410);

        verify(userRepository, never()).save(any());
    }

    @Test
    void reset_withAlreadyUsedToken_throwsGone() {
        when(inviteTokenGenerator.hash(anyString())).thenReturn("hash");
        when(passwordResetTokenRepository.findByTokenHash("hash"))
                .thenReturn(Optional.of(tokenWith(LocalDateTime.now().plusMinutes(30), LocalDateTime.now().minusMinutes(1), true)));
        when(passwordResetTokenRepository.consumeByTokenHash(anyString(), any(), any())).thenReturn(0);

        assertThatThrownBy(() -> resetPasswordService.reset("raw-token", "novaSenha123"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("já foi utilizado");
    }

    @Test
    void reset_withInactiveToken_throwsGone() {
        when(inviteTokenGenerator.hash(anyString())).thenReturn("hash");
        when(passwordResetTokenRepository.findByTokenHash("hash"))
                .thenReturn(Optional.of(tokenWith(LocalDateTime.now().plusMinutes(30), null, false)));
        when(passwordResetTokenRepository.consumeByTokenHash(anyString(), any(), any())).thenReturn(0);

        assertThatThrownBy(() -> resetPasswordService.reset("raw-token", "novaSenha123"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("não está mais disponível");
    }
}
