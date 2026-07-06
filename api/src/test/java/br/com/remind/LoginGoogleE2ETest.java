package br.com.remind;

import br.com.remind.domain.User;
import br.com.remind.enums.UserType;
import br.com.remind.repository.AddressRepository;
import br.com.remind.repository.PsychologistRepository;
import br.com.remind.repository.UserRepository;
import br.com.remind.service.login.GoogleClaims;
import br.com.remind.service.login.GoogleTokenVerifier;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.Base64;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * TASK-007 — Testes End-to-End do Login com Google (Psicólogo).
 *
 * <p>Percorre os fluxos 1–4, rejeições, formato do token, autorização por perfil incompleto e o
 * guard de login por senha em conta só-Google. O {@link GoogleTokenVerifier} é mockado para operar
 * de forma determinística, sem depender da rede do Google (REQ-NR + DoR da tarefa).
 */
@SpringBootTest
@AutoConfigureMockMvc
class LoginGoogleE2ETest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PsychologistRepository psychologistRepository;

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockitoBean
    private GoogleTokenVerifier googleTokenVerifier;

    private static final Pattern TOKEN_PATTERN = Pattern.compile("\"accessToken\":\"([^\"]+)\"");

    @BeforeEach
    void resetData() {
        // Ordem respeitando FKs: psychologists -> addresses/users.
        psychologistRepository.deleteAll();
        addressRepository.deleteAll();
        userRepository.deleteAll();
    }

    private String extractToken(String responseBody) {
        Matcher matcher = TOKEN_PATTERN.matcher(responseBody);
        assertThat(matcher.find()).as("accessToken presente no corpo").isTrue();
        return matcher.group(1);
    }

    private String payloadOf(String jwt) {
        String payload = jwt.split("\\.")[1];
        return new String(Base64.getUrlDecoder().decode(payload), StandardCharsets.UTF_8);
    }

    private String completeProfileBody() {
        return """
                {"cpf":"38492017566","phone":"9812345678","street":"Rua das Flores",
                 "number":123,"cep":"95780000","neighborhood":"Centro","city":"Montenegro"}""";
    }

    private long countByEmail(String email) {
        return userRepository.findAll().stream().filter(u -> email.equals(u.getEmail())).count();
    }

    @Test
    void flow1and4_newAccount_pending_thenCompleteProfile() throws Exception {
        when(googleTokenVerifier.verify(eq("new-token")))
                .thenReturn(new GoogleClaims("sub-new", "novo@e2e.com", true, "Novo E2E"));

        // Fluxo 1: conta nova → pendente.
        String loginBody = mockMvc.perform(post("/login/google")
                        .contentType(APPLICATION_JSON)
                        .content("{\"idToken\":\"new-token\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profileComplete").value(false))
                .andExpect(jsonPath("$.type").value("PSYCHOLOGIST"))
                .andReturn().getResponse().getContentAsString();
        String token = extractToken(loginBody);

        // AC-8: endpoint protegido não relacionado é bloqueado (403) para perfil incompleto.
        mockMvc.perform(get("/pacientes").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        // Fluxo 4: conclusão de perfil liberada.
        mockMvc.perform(put("/psychologists/me/profile")
                        .header("Authorization", "Bearer " + token)
                        .contentType(APPLICATION_JSON)
                        .content(completeProfileBody()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profileComplete").value(true));

        User completed = userRepository.findByEmail("novo@e2e.com").orElseThrow();
        assertThat(completed.getProfileComplete()).isTrue();
        assertThat(completed.getCpf()).isEqualTo("38492017566");

        // Leitura do próprio perfil liberada.
        mockMvc.perform(get("/psychologists/me/profile").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profileComplete").value(true));

        // Fluxo 2 (recorrente): segundo login reconhece a mesma conta, sem duplicar.
        mockMvc.perform(post("/login/google")
                        .contentType(APPLICATION_JSON)
                        .content("{\"idToken\":\"new-token\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profileComplete").value(true));
        assertThat(countByEmail("novo@e2e.com")).isEqualTo(1);
    }

    @Test
    void flow3_existingPsychologist_linksGoogleSub_preservingData() throws Exception {
        User existing = userRepository.save(User.builder()
                .name("Camila Original")
                .email("camila@e2e.com")
                .cpf("38492017566")
                .phone("9812345678")
                .password(passwordEncoder.encode("secret"))
                .type(UserType.PSYCHOLOGIST)
                .profileComplete(true)
                .created_at(LocalDate.now())
                .updated_at(LocalDate.now())
                .active(true)
                .build());

        when(googleTokenVerifier.verify(eq("link-token")))
                .thenReturn(new GoogleClaims("sub-link", "camila@e2e.com", true, "Nome Diferente"));

        mockMvc.perform(post("/login/google")
                        .contentType(APPLICATION_JSON)
                        .content("{\"idToken\":\"link-token\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profileComplete").value(true));

        User linked = userRepository.findById(existing.getId()).orElseThrow();
        assertThat(linked.getGoogleSub()).isEqualTo("sub-link");
        assertThat(linked.getName()).isEqualTo("Camila Original");
        assertThat(linked.getCpf()).isEqualTo("38492017566");
    }

    @Test
    void rejections_patient403_invalid401_unverified401_withoutWrite() throws Exception {
        userRepository.save(User.builder()
                .name("Paciente E2E").email("paciente@e2e.com")
                .type(UserType.PATIENT).profileComplete(true)
                .created_at(LocalDate.now()).updated_at(LocalDate.now()).active(true)
                .build());

        when(googleTokenVerifier.verify(eq("patient-token")))
                .thenReturn(new GoogleClaims("sub-p", "paciente@e2e.com", true, "Paciente E2E"));
        when(googleTokenVerifier.verify(eq("bad-token")))
                .thenThrow(new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.UNAUTHORIZED, "inválido"));
        when(googleTokenVerifier.verify(eq("unverified-token")))
                .thenReturn(new GoogleClaims("sub-u", "unverified@e2e.com", false, "Não Verificado"));

        mockMvc.perform(post("/login/google").contentType(APPLICATION_JSON)
                        .content("{\"idToken\":\"patient-token\"}"))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/login/google").contentType(APPLICATION_JSON)
                        .content("{\"idToken\":\"bad-token\"}"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/login/google").contentType(APPLICATION_JSON)
                        .content("{\"idToken\":\"unverified-token\"}"))
                .andExpect(status().isUnauthorized());

        assertThat(userRepository.findByEmail("paciente@e2e.com").orElseThrow().getGoogleSub()).isNull();
        assertThat(userRepository.findByEmail("unverified@e2e.com")).isEmpty();
    }

    @Test
    void ac7_googleAndPasswordTokens_haveSameFormat() throws Exception {
        userRepository.save(User.builder()
                .name("Parity Psi").email("parity@e2e.com")
                .cpf("11122233344").phone("9800000000")
                .password(passwordEncoder.encode("secret"))
                .type(UserType.PSYCHOLOGIST).profileComplete(true)
                .created_at(LocalDate.now()).updated_at(LocalDate.now()).active(true)
                .build());
        when(googleTokenVerifier.verify(eq("parity-token")))
                .thenReturn(new GoogleClaims("sub-parity", "parity@e2e.com", true, "Parity Psi"));

        String pwdBody = mockMvc.perform(post("/login").contentType(APPLICATION_JSON)
                        .content("{\"email\":\"parity@e2e.com\",\"password\":\"secret\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String googleBody = mockMvc.perform(post("/login/google").contentType(APPLICATION_JSON)
                        .content("{\"idToken\":\"parity-token\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String pwdPayload = payloadOf(extractToken(pwdBody));
        String googlePayload = payloadOf(extractToken(googleBody));

        for (String payload : List.of(pwdPayload, googlePayload)) {
            assertThat(payload).contains("\"iss\":\"tcc\"");
            assertThat(payload).contains("\"sub\":\"Parity Psi\"");
            assertThat(payload).contains("\"email\":\"parity@e2e.com\"");
        }
    }

    @Test
    void ac10_passwordLogin_onGoogleOnlyAccount_isRejectedWithGoogleMessage() throws Exception {
        when(googleTokenVerifier.verify(eq("goonly-token")))
                .thenReturn(new GoogleClaims("sub-go", "goonly@e2e.com", true, "Google Only"));

        // Cria a conta só-Google (sem senha).
        mockMvc.perform(post("/login/google").contentType(APPLICATION_JSON)
                        .content("{\"idToken\":\"goonly-token\"}"))
                .andExpect(status().isOk());

        // Login por senha nessa conta → 401 com mensagem de login do Google.
        mockMvc.perform(post("/login").contentType(APPLICATION_JSON)
                        .content("{\"email\":\"goonly@e2e.com\",\"password\":\"qualquer\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Google")));
    }
}
