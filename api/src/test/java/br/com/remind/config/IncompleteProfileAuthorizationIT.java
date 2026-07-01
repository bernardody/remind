package br.com.remind.config;

import br.com.remind.domain.Address;
import br.com.remind.domain.Psychologist;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * TASK-006 — Autorização por perfil incompleto (403 nas demais operações, REQ-013).
 */
@SpringBootTest
@AutoConfigureMockMvc
class IncompleteProfileAuthorizationIT {

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

    private String tokenFor(String email, boolean profileComplete) {
        User user = userRepository.save(User.builder()
                .name("Psi").email(email)
                .type(UserType.PSYCHOLOGIST).profileComplete(profileComplete)
                .created_at(LocalDate.now()).updated_at(LocalDate.now()).active(true)
                .build());
        return accessTokenService.generate(user).getTokenValue();
    }

    @Test
    void incompleteProfile_onUnrelatedProtectedEndpoint_isForbidden() throws Exception {
        String token = tokenFor("incompleto@it.com", false);

        mockMvc.perform(get("/pacientes").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void incompleteProfile_canReadOwnProfile() throws Exception {
        String token = tokenFor("incompleto2@it.com", false);

        mockMvc.perform(get("/psychologists/me/profile").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void completeProfile_accessesProtectedEndpointNormally() throws Exception {
        User user = userRepository.save(User.builder()
                .name("Completo").email("completo@it.com")
                .type(UserType.PSYCHOLOGIST).profileComplete(true)
                .created_at(LocalDate.now()).updated_at(LocalDate.now()).active(true)
                .build());
        Address address = addressRepository.save(Address.builder()
                .street("Rua A").number(1).cep("95780000").neighborhood("Centro").city("Cidade")
                .created_at(LocalDate.now()).updated_at(LocalDate.now()).active(true)
                .build());
        psychologistRepository.save(Psychologist.builder()
                .user(user).address(address)
                .created_at(LocalDate.now()).updated_at(LocalDate.now()).active(true)
                .build());
        String token = accessTokenService.generate(user).getTokenValue();

        mockMvc.perform(get("/pacientes").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void noToken_isUnauthorized_not403() throws Exception {
        mockMvc.perform(get("/pacientes"))
                .andExpect(status().isUnauthorized());
    }
}
