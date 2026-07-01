package br.com.remind.service.psychologist;

import br.com.remind.controller.request.psychologist.CompleteProfileRequest;
import br.com.remind.controller.response.psychologist.CompleteProfileResponse;
import br.com.remind.domain.Address;
import br.com.remind.domain.Psychologist;
import br.com.remind.domain.User;
import br.com.remind.enums.UserType;
import br.com.remind.repository.AddressRepository;
import br.com.remind.repository.PsychologistRepository;
import br.com.remind.repository.UserRepository;
import br.com.remind.service.user.AuthenticatedUserService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CompleteProfileServiceTest {

    @Mock
    private AuthenticatedUserService authenticatedUserService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PsychologistRepository psychologistRepository;

    @Mock
    private AddressRepository addressRepository;

    @InjectMocks
    private CompleteProfileService completeProfileService;

    private CompleteProfileRequest validRequest() {
        CompleteProfileRequest request = new CompleteProfileRequest();
        request.setCpf("38492017566");
        request.setPhone("9812345678");
        request.setStreet("Rua das Flores");
        request.setNumber(123);
        request.setCep("95780000");
        request.setNeighborhood("Centro");
        request.setCity("Montenegro");
        return request;
    }

    private User pendingUser() {
        return User.builder()
                .id(2L)
                .name("Novo Psicólogo")
                .email("novo@gmail.com")
                .type(UserType.PSYCHOLOGIST)
                .googleSub("google-sub-xyz")
                .profileComplete(false)
                .build();
    }

    @Test
    void complete_withValidData_updatesUserAndCreatesAddressAndPsychologist() {
        User user = pendingUser();
        when(authenticatedUserService.get()).thenReturn(user);

        CompleteProfileResponse response = completeProfileService.complete(validRequest());

        ArgumentCaptor<Address> addressCaptor = ArgumentCaptor.forClass(Address.class);
        verify(addressRepository).save(addressCaptor.capture());
        Address savedAddress = addressCaptor.getValue();
        assertThat(savedAddress.getStreet()).isEqualTo("Rua das Flores");
        assertThat(savedAddress.getNumber()).isEqualTo(123);
        assertThat(savedAddress.getCep()).isEqualTo("95780000");

        ArgumentCaptor<Psychologist> psychologistCaptor = ArgumentCaptor.forClass(Psychologist.class);
        verify(psychologistRepository).save(psychologistCaptor.capture());
        Psychologist savedPsychologist = psychologistCaptor.getValue();
        assertThat(savedPsychologist.getUser()).isSameAs(user);
        assertThat(savedPsychologist.getAddress()).isSameAs(savedAddress);

        verify(userRepository).save(user);
        assertThat(user.getCpf()).isEqualTo("38492017566");
        assertThat(user.getPhone()).isEqualTo("9812345678");
        assertThat(user.getProfileComplete()).isTrue();

        assertThat(response.profileComplete()).isTrue();
    }

    @Test
    void complete_whenProfileAlreadyComplete_isRejected_withoutPersisting() {
        User user = pendingUser();
        user.setProfileComplete(true);
        when(authenticatedUserService.get()).thenReturn(user);

        assertThatThrownBy(() -> completeProfileService.complete(validRequest()))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode().value())
                .isEqualTo(409);

        verify(addressRepository, never()).save(any());
        verify(psychologistRepository, never()).save(any());
        verify(userRepository, never()).save(any());
    }
}
