package br.com.remind.service.login;

import br.com.remind.controller.response.login.LoginResponse;
import br.com.remind.domain.User;
import br.com.remind.enums.UserType;
import br.com.remind.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GoogleLoginServiceTest {

    @Mock
    private GoogleTokenVerifier googleTokenVerifier;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AccessTokenService accessTokenService;

    @InjectMocks
    private GoogleLoginService googleLoginService;

    private static final String ID_TOKEN = "google-id-token";

    private GoogleClaims claims(String email, boolean emailVerified) {
        return new GoogleClaims("google-sub-xyz", email, emailVerified, "Novo Psicólogo");
    }

    private Jwt dummyJwt() {
        return new Jwt("app-token", Instant.now(), Instant.now().plusSeconds(600),
                Map.of("alg", "RS256"), Map.of("sub", "user"));
    }

    private void stubTokenIssuance() {
        when(accessTokenService.generate(any(User.class))).thenReturn(dummyJwt());
    }

    @Test
    void login_newEmail_createsPendingPsychologist() {
        when(googleTokenVerifier.verify(ID_TOKEN)).thenReturn(claims("novo@gmail.com", true));
        when(userRepository.findByEmail("novo@gmail.com")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        stubTokenIssuance();

        LoginResponse response = googleLoginService.login(ID_TOKEN);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User created = captor.getValue();

        assertThat(created.getType()).isEqualTo(UserType.PSYCHOLOGIST);
        assertThat(created.getProfileComplete()).isFalse();
        assertThat(created.getGoogleSub()).isEqualTo("google-sub-xyz");
        assertThat(created.getName()).isEqualTo("Novo Psicólogo");
        assertThat(created.getPassword()).isNull();
        assertThat(created.getCpf()).isNull();
        assertThat(created.getPhone()).isNull();

        assertThat(response.accessToken()).isEqualTo("app-token");
        assertThat(response.type()).isEqualTo(UserType.PSYCHOLOGIST);
        assertThat(response.profileComplete()).isFalse();
    }

    @Test
    void login_existingPsychologist_linksGoogleSubWithoutOverwritingData() {
        User existing = User.builder()
                .id(2L)
                .name("Camila Original")
                .email("camila@gmail.com")
                .cpf("38492017566")
                .phone("9812345678")
                .password("hashed")
                .type(UserType.PSYCHOLOGIST)
                .profileComplete(true)
                .build();
        when(googleTokenVerifier.verify(ID_TOKEN)).thenReturn(claims("camila@gmail.com", true));
        when(userRepository.findByEmail("camila@gmail.com")).thenReturn(Optional.of(existing));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        stubTokenIssuance();

        LoginResponse response = googleLoginService.login(ID_TOKEN);

        assertThat(existing.getGoogleSub()).isEqualTo("google-sub-xyz");
        assertThat(existing.getName()).isEqualTo("Camila Original");
        assertThat(existing.getCpf()).isEqualTo("38492017566");
        assertThat(existing.getPassword()).isEqualTo("hashed");
        assertThat(response.profileComplete()).isTrue();
    }

    @Test
    void login_recurring_recognizesAccountWithoutDuplicating() {
        User existing = User.builder()
                .id(2L)
                .name("Camila")
                .email("camila@gmail.com")
                .type(UserType.PSYCHOLOGIST)
                .googleSub("google-sub-xyz")
                .profileComplete(false)
                .build();
        when(googleTokenVerifier.verify(ID_TOKEN)).thenReturn(claims("camila@gmail.com", true));
        when(userRepository.findByEmail("camila@gmail.com")).thenReturn(Optional.of(existing));
        stubTokenIssuance();

        googleLoginService.login(ID_TOKEN);

        // Já vinculado: não há nova escrita.
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void login_patientEmail_isRejectedWith403_withoutPersisting() {
        User patient = User.builder()
                .id(1L)
                .name("Paciente")
                .email("paciente@gmail.com")
                .type(UserType.PATIENT)
                .build();
        when(googleTokenVerifier.verify(ID_TOKEN)).thenReturn(claims("paciente@gmail.com", true));
        when(userRepository.findByEmail("paciente@gmail.com")).thenReturn(Optional.of(patient));

        assertThatThrownBy(() -> googleLoginService.login(ID_TOKEN))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode().value())
                .isEqualTo(403);

        verify(userRepository, never()).save(any(User.class));
        verify(accessTokenService, never()).generate(any());
    }

    @Test
    void login_emailNotVerified_isRejectedWith401_withoutPersisting() {
        when(googleTokenVerifier.verify(ID_TOKEN)).thenReturn(claims("novo@gmail.com", false));

        assertThatThrownBy(() -> googleLoginService.login(ID_TOKEN))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode().value())
                .isEqualTo(401);

        verify(userRepository, never()).save(any(User.class));
        verify(userRepository, never()).findByEmail(any());
    }

    @Test
    void login_invalidToken_propagatesRejection_withoutPersisting() {
        when(googleTokenVerifier.verify(ID_TOKEN))
                .thenThrow(new ResponseStatusException(org.springframework.http.HttpStatus.UNAUTHORIZED, "inválido"));

        assertThatThrownBy(() -> googleLoginService.login(ID_TOKEN))
                .isInstanceOf(ResponseStatusException.class);

        verify(userRepository, never()).save(any(User.class));
    }
}
