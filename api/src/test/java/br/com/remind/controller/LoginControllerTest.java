package br.com.remind.controller;

import br.com.remind.controller.request.login.LoginRequest;
import br.com.remind.controller.response.login.LoginResponse;
import br.com.remind.domain.User;
import br.com.remind.enums.UserType;
import br.com.remind.service.login.AccessTokenService;
import br.com.remind.service.login.SearchUserService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LoginControllerTest {

    @Mock
    private SearchUserService searchUserService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AccessTokenService accessTokenService;

    @InjectMocks
    private LoginController loginController;

    private LoginRequest request(String email, String password) {
        LoginRequest request = new LoginRequest();
        request.setEmail(email);
        request.setPassword(password);
        return request;
    }

    private Jwt dummyJwt() {
        return new Jwt("token-value", Instant.now(), Instant.now().plusSeconds(600),
                Map.of("alg", "RS256"), Map.of("sub", "user"));
    }

    @Test
    void login_withValidPassword_returns200TokenAndProfileComplete() {
        User user = User.builder()
                .name("Camila")
                .email("camila@example.com")
                .password("hashed")
                .type(UserType.PSYCHOLOGIST)
                .profileComplete(true)
                .build();
        when(searchUserService.searchByEmail("camila@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("secret", "hashed")).thenReturn(true);
        when(accessTokenService.generate(user)).thenReturn(dummyJwt());

        ResponseEntity<LoginResponse> response = loginController.login(request("camila@example.com", "secret"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().accessToken()).isEqualTo("token-value");
        assertThat(response.getBody().type()).isEqualTo(UserType.PSYCHOLOGIST);
        assertThat(response.getBody().profileComplete()).isTrue();
        assertThat(response.getBody().expiresIn()).isEqualTo(AccessTokenService.EXPIRES_IN);
    }

    @Test
    void login_onGoogleOnlyAccount_isRejectedWith401_withoutCheckingPassword() {
        User googleOnly = User.builder()
                .name("Google User")
                .email("google@example.com")
                .password(null)
                .type(UserType.PSYCHOLOGIST)
                .build();
        when(searchUserService.searchByEmail("google@example.com")).thenReturn(Optional.of(googleOnly));

        assertThatThrownBy(() -> loginController.login(request("google@example.com", "whatever")))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Google")
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode().value())
                .isEqualTo(401);

        verify(passwordEncoder, never()).matches(anyString(), anyString());
        verify(accessTokenService, never()).generate(any());
    }

    @Test
    void login_withUnknownEmail_isRejectedWith401() {
        when(searchUserService.searchByEmail("ghost@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> loginController.login(request("ghost@example.com", "x")))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode().value())
                .isEqualTo(401);
    }

    @Test
    void login_withWrongPassword_isRejectedWith401() {
        User user = User.builder()
                .name("Camila")
                .email("camila@example.com")
                .password("hashed")
                .type(UserType.PSYCHOLOGIST)
                .build();
        when(searchUserService.searchByEmail("camila@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);

        assertThatThrownBy(() -> loginController.login(request("camila@example.com", "wrong")))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode().value())
                .isEqualTo(401);

        verify(accessTokenService, never()).generate(any());
    }
}
