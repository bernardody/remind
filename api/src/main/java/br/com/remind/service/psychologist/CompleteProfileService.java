package br.com.remind.service.psychologist;

import br.com.remind.controller.request.psychologist.CompleteProfileRequest;
import br.com.remind.controller.response.psychologist.CompleteProfileResponse;
import br.com.remind.domain.Address;
import br.com.remind.domain.Psychologist;
import br.com.remind.domain.User;
import br.com.remind.repository.AddressRepository;
import br.com.remind.repository.PsychologistRepository;
import br.com.remind.repository.UserRepository;
import br.com.remind.service.user.AuthenticatedUserService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;

import static org.springframework.http.HttpStatus.CONFLICT;

/**
 * Conclui o perfil de uma <b>Conta Pendente</b> de psicólogo: preenche CPF/telefone no
 * {@link User}, cria as linhas {@link Address} + {@link Psychologist} e marca
 * {@code profile_complete = true} — tudo numa única operação transacional (REQ-010).
 */
@Service
@RequiredArgsConstructor
public class CompleteProfileService {

    private final AuthenticatedUserService authenticatedUserService;
    private final UserRepository userRepository;
    private final PsychologistRepository psychologistRepository;
    private final AddressRepository addressRepository;

    @Transactional
    public CompleteProfileResponse complete(CompleteProfileRequest request) {
        User user = authenticatedUserService.get();

        if (Boolean.TRUE.equals(user.getProfileComplete())) {
            throw new ResponseStatusException(CONFLICT, "Perfil já foi concluído.");
        }

        LocalDate now = LocalDate.now();

        Address address = Address.builder()
                .street(request.getStreet())
                .number(request.getNumber())
                .cep(request.getCep())
                .neighborhood(request.getNeighborhood())
                .city(request.getCity())
                .created_at(now)
                .updated_at(now)
                .active(true)
                .build();
        addressRepository.save(address);

        Psychologist psychologist = Psychologist.builder()
                .user(user)
                .address(address)
                .created_at(now)
                .updated_at(now)
                .active(true)
                .build();
        psychologistRepository.save(psychologist);

        user.setCpf(request.getCpf());
        user.setPhone(request.getPhone());
        user.setProfileComplete(true);
        user.setUpdated_at(now);
        userRepository.save(user);

        return new CompleteProfileResponse(true);
    }
}
