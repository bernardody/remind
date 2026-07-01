package br.com.remind.controller;

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
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * TASK-004 — Integração de {@code POST /login/google} (endpoint público).
 */
@SpringBootTest
@AutoConfigureMockMvc
class GoogleLoginControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PsychologistRepository psychologistRepository;

    @Autowired
    private AddressRepository addressRepository;

    @MockitoBean
    private GoogleTokenVerifier googleTokenVerifier;

    @BeforeEach
    void resetData() {
        psychologistRepository.deleteAll();
        addressRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void newEmail_createsPendingPsychologist_andIsPubliclyAccessible() throws Exception {
        when(googleTokenVerifier.verify(eq("tok")))
                .thenReturn(new GoogleClaims("sub-new", "novo@it.com", true, "Novo IT"));

        mockMvc.perform(post("/login/google").contentType(APPLICATION_JSON)
                        .content("{\"idToken\":\"tok\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type").value("PSYCHOLOGIST"))
                .andExpect(jsonPath("$.profileComplete").value(false))
                .andExpect(jsonPath("$.accessToken").isNotEmpty());

        User created = userRepository.findByEmail("novo@it.com").orElseThrow();
        assertThat(created.getGoogleSub()).isEqualTo("sub-new");
        assertThat(created.getProfileComplete()).isFalse();
    }

    @Test
    void patientEmail_isRejectedWith403_andStateUnchanged() throws Exception {
        userRepository.save(User.builder()
                .name("Paciente").email("paciente@it.com")
                .type(UserType.PATIENT).profileComplete(true)
                .created_at(LocalDate.now()).updated_at(LocalDate.now()).active(true)
                .build());
        when(googleTokenVerifier.verify(eq("patient-tok")))
                .thenReturn(new GoogleClaims("sub-p", "paciente@it.com", true, "Paciente"));

        mockMvc.perform(post("/login/google").contentType(APPLICATION_JSON)
                        .content("{\"idToken\":\"patient-tok\"}"))
                .andExpect(status().isForbidden());

        assertThat(userRepository.findByEmail("paciente@it.com").orElseThrow().getGoogleSub()).isNull();
    }

    @Test
    void missingIdToken_returns400() throws Exception {
        mockMvc.perform(post("/login/google").contentType(APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }
}
