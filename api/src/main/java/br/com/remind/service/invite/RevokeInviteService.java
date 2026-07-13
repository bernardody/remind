package br.com.remind.service.invite;

import br.com.remind.domain.Psychologist;
import br.com.remind.domain.QuestionnaireInvite;
import br.com.remind.domain.User;
import br.com.remind.enums.InviteStatus;
import br.com.remind.repository.PsychologistRepository;
import br.com.remind.repository.QuestionnaireInviteRepository;
import br.com.remind.service.user.AuthenticatedUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;

import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.NOT_FOUND;

/** Revogação de convite (INV-007) — sempre uma ação explícita do psicólogo. */
@RequiredArgsConstructor
@Service
public class RevokeInviteService {

    private final QuestionnaireInviteRepository questionnaireInviteRepository;
    private final PsychologistRepository psychologistRepository;
    private final AuthenticatedUserService authenticatedUserService;

    @Transactional
    public void revoke(Long inviteId) {
        User authenticatedUser = authenticatedUserService.get();

        Psychologist psychologist = psychologistRepository.findByUser(authenticatedUser)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Psicólogo não encontrado"));

        QuestionnaireInvite invite = questionnaireInviteRepository.findById(inviteId)
                .filter(i -> i.getPsychologist().getId().equals(psychologist.getId())) // INV-011
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Convite não encontrado"));

        if (invite.getStatus() == InviteStatus.ANSWERED) {
            throw new ResponseStatusException(CONFLICT, "Convite já foi respondido, não pode ser revogado");
        }

        invite.setStatus(InviteStatus.REVOKED);
        invite.setActive(false); // libera o par paciente/questionário para um novo convite futuro
        invite.setUpdated_at(LocalDate.now());

        questionnaireInviteRepository.save(invite);
    }
}
