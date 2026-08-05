package br.com.remind.service.admin;

import br.com.remind.domain.User;
import br.com.remind.enums.UserType;
import br.com.remind.repository.UserRepository;
import br.com.remind.service.password.RequestPasswordResetService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CreatePsychologistServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RequestPasswordResetService requestPasswordResetService;

    @InjectMocks
    private CreatePsychologistService createPsychologistService;

    @Test
    void create_whenEmailNotRegistered_savesUserWithoutPassword_andTriggersActivationEmail() {
        when(userRepository.existsByEmail("novo@clinica.com")).thenReturn(false);

        createPsychologistService.create("Novo Psicólogo", "novo@clinica.com");

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User saved = captor.getValue();
        assertThat(saved.getName()).isEqualTo("Novo Psicólogo");
        assertThat(saved.getEmail()).isEqualTo("novo@clinica.com");
        assertThat(saved.getType()).isEqualTo(UserType.PSYCHOLOGIST);
        assertThat(saved.getPassword()).isNull();
        assertThat(saved.getProfileComplete()).isFalse();
        assertThat(saved.getActive()).isTrue();

        verify(requestPasswordResetService).request("novo@clinica.com");
    }

    @Test
    void create_whenEmailAlreadyRegistered_throwsConflict_withoutSavingOrEmailing() {
        when(userRepository.existsByEmail("existente@clinica.com")).thenReturn(true);

        assertThatThrownBy(() -> createPsychologistService.create("Alguém", "existente@clinica.com"))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode().value())
                .isEqualTo(409);

        verify(userRepository, never()).save(org.mockito.ArgumentMatchers.any());
        verify(requestPasswordResetService, never()).request(org.mockito.ArgumentMatchers.any());
    }
}
