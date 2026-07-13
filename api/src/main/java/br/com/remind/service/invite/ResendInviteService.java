package br.com.remind.service.invite;

import br.com.remind.controller.response.invite.InviteResponse;
import br.com.remind.domain.Psychologist;
import br.com.remind.domain.QuestionnaireInvite;
import br.com.remind.domain.User;
import br.com.remind.enums.InviteStatus;
import br.com.remind.mapper.invite.InviteMapper;
import br.com.remind.repository.PsychologistRepository;
import br.com.remind.repository.QuestionnaireInviteRepository;
import br.com.remind.service.mail.MailService;
import br.com.remind.service.user.AuthenticatedUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.NOT_FOUND;

/**
 * Reenvio de convite (INV-006): rotaciona o token (invalida o anterior) e reseta a
 * expiração, em vez de acumular convites para o mesmo par paciente/questionário.
 */
@RequiredArgsConstructor
@Service
public class ResendInviteService {

    private final QuestionnaireInviteRepository questionnaireInviteRepository;
    private final PsychologistRepository psychologistRepository;
    private final AuthenticatedUserService authenticatedUserService;
    private final InviteTokenGenerator inviteTokenGenerator;
    private final MailService mailService;
    private final InviteMapper inviteMapper;

    @Value("${remind.invite.expiration-days:7}")
    private long expirationDays;

    @Value("${remind.invite.base-url}")
    private String baseUrl;

    @Transactional
    public InviteResponse resend(Long inviteId) {
        User authenticatedUser = authenticatedUserService.get();

        Psychologist psychologist = psychologistRepository.findByUser(authenticatedUser)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Psicólogo não encontrado"));

        QuestionnaireInvite invite = questionnaireInviteRepository.findById(inviteId)
                .filter(i -> i.getPsychologist().getId().equals(psychologist.getId())) // INV-011
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Convite não encontrado"));

        if (invite.getStatus() == InviteStatus.ANSWERED) {
            throw new ResponseStatusException(CONFLICT, "Convite já foi respondido");
        }

        String rawToken = inviteTokenGenerator.generateRawToken();
        invite.setToken_hash(inviteTokenGenerator.hash(rawToken));
        invite.setStatus(InviteStatus.PENDING);
        invite.setExpires_at(LocalDateTime.now().plusDays(expirationDays));
        invite.setUpdated_at(LocalDate.now());
        invite.setActive(true);

        questionnaireInviteRepository.save(invite);

        String inviteLink = baseUrl + "/convite/" + rawToken;

        mailService.sendQuestionnaireInvite(
                invite.getPatient().getUser().getEmail(),
                invite.getPatient().getUser().getName(),
                invite.getQuestionnaire().getTitle(),
                inviteLink,
                invite.getExpires_at()
        );

        invite.setStatus(InviteStatus.SENT);
        invite.setSent_at(LocalDateTime.now());
        questionnaireInviteRepository.save(invite);

        return inviteMapper.toResponse(invite, inviteLink);
    }
}
