package br.com.remind.controller;

import br.com.remind.domain.User;
import br.com.remind.enums.UserType;
import br.com.remind.repository.AddressRepository;
import br.com.remind.repository.PsychologistRepository;
import br.com.remind.repository.UserRepository;
import br.com.remind.service.login.AccessTokenService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * TASK-005 — Integração de {@code PUT /psychologists/me/profile} (conclusão de perfil).
 */
@SpringBootTest
@AutoConfigureMockMvc
class PsychologistControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PsychologistRepository psychologistRepository;

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private AccessTokenService accessTokenService;

    @BeforeEach
    void resetData() {
        psychologistRepository.deleteAll();
        addressRepository.deleteAll();
        userRepository.deleteAll();
    }

    private User savePendingPsychologist(String email) {
        return userRepository.save(User.builder()
                .name("Pendente").email(email)
                .type(UserType.PSYCHOLOGIST).googleSub("sub-" + email).profileComplete(false)
                .created_at(LocalDate.now()).updated_at(LocalDate.now()).active(true)
                .build());
    }

    private String tokenFor(User user) {
        return accessTokenService.generate(user).getTokenValue();
    }

    private String validBody() {
        return """
                {"cpf":"38492017566","phone":"9812345678","street":"Rua das Flores",
                 "number":123,"cep":"95780000","neighborhood":"Centro","city":"Montenegro"}""";
    }

    @Test
    void completeProfile_withValidData_marksAccountComplete() throws Exception {
        User user = savePendingPsychologist("pendente@it.com");

        mockMvc.perform(put("/psychologists/me/profile")
                        .header("Authorization", "Bearer " + tokenFor(user))
                        .contentType(APPLICATION_JSON)
                        .content(validBody()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profileComplete").value(true));

        User reloaded = userRepository.findByEmail("pendente@it.com").orElseThrow();
        assertThat(reloaded.getProfileComplete()).isTrue();
        assertThat(reloaded.getCpf()).isEqualTo("38492017566");
        assertThat(psychologistRepository.findByUser(reloaded)).isPresent();
    }

    @Test
    void completeProfile_withMissingFields_returns400_andStateUnchanged() throws Exception {
        User user = savePendingPsychologist("pendente2@it.com");

        mockMvc.perform(put("/psychologists/me/profile")
                        .header("Authorization", "Bearer " + tokenFor(user))
                        .contentType(APPLICATION_JSON)
                        .content("{\"cpf\":\"38492017566\"}"))
                .andExpect(status().isBadRequest());

        assertThat(userRepository.findByEmail("pendente2@it.com").orElseThrow().getProfileComplete()).isFalse();
    }

    @Test
    void completeProfile_withoutToken_returns401() throws Exception {
        mockMvc.perform(put("/psychologists/me/profile")
                        .contentType(APPLICATION_JSON)
                        .content(validBody()))
                .andExpect(status().isUnauthorized());
    }
}
