package br.com.remind.service.invite;

import br.com.remind.controller.response.invite.InviteResponse;
import br.com.remind.domain.Patient;
import br.com.remind.domain.Psychologist;
import br.com.remind.domain.Questionnaire;
import br.com.remind.domain.QuestionnaireInvite;
import br.com.remind.domain.User;
import br.com.remind.enums.InviteStatus;
import br.com.remind.mapper.invite.InviteMapper;
import br.com.remind.repository.PatientRepository;
import br.com.remind.repository.PsychologistRepository;
import br.com.remind.repository.QuestionnaireAnswerRepository;
import br.com.remind.repository.QuestionnaireInviteRepository;
import br.com.remind.repository.QuestionnaireRepository;
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
 * Cria (ou reutiliza, INV-002) o convite de um paciente para um questionário e dispara o
 * e-mail (docs/specs/002-convite-questionario/PRD.md §6/§13).
 */
@RequiredArgsConstructor
@Service
public class CreateInviteService {

    private final PatientRepository patientRepository;
    private final PsychologistRepository psychologistRepository;
    private final QuestionnaireRepository questionnaireRepository;
    private final QuestionnaireAnswerRepository questionnaireAnswerRepository;
    private final QuestionnaireInviteRepository questionnaireInviteRepository;
    private final AuthenticatedUserService authenticatedUserService;
    private final InviteTokenGenerator inviteTokenGenerator;
    private final MailService mailService;
    private final InviteMapper inviteMapper;

    @Value("${remind.invite.expiration-days:7}")
    private long expirationDays;

    @Value("${remind.invite.base-url}")
    private String baseUrl;

    @Transactional
    public InviteResponse create(Long patientId, Long questionnaireId) {
        User authenticatedUser = authenticatedUserService.get();

        Psychologist psychologist = psychologistRepository.findByUser(authenticatedUser)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Psicólogo não encontrado"));

        // `findByIdAndPsychologistAndActiveTrue` já garante que o paciente pertence a este
        // psicólogo (INV-011) — um paciente de outro psicólogo simplesmente não é encontrado.
        Patient patient = patientRepository.findByIdAndPsychologistAndActiveTrue(patientId, psychologist)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Paciente não encontrado"));

        Questionnaire questionnaire = questionnaireRepository.findByIdAndActiveTrue(questionnaireId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Questionário não encontrado"));

        if (questionnaireAnswerRepository.findByPatientAndQuestionnaire(patient, questionnaire).isPresent()) {
            throw new ResponseStatusException(CONFLICT, "Paciente já respondeu este questionário"); // INV-004
        }

        // INV-002: reutiliza o convite existente do mesmo par paciente/questionário (se houver)
        // em vez de criar um segundo registro — mesma rotação de token usada no reenvio.
        QuestionnaireInvite invite = questionnaireInviteRepository
                .findByPatientAndQuestionnaireAndActiveTrue(patient, questionnaire)
                .orElseGet(() -> QuestionnaireInvite.builder()
                        .patient(patient)
                        .questionnaire(questionnaire)
                        .psychologist(psychologist)
                        .created_at(LocalDate.now())
                        .active(true)
                        .build());

        String rawToken = inviteTokenGenerator.generateRawToken();
        invite.setToken_hash(inviteTokenGenerator.hash(rawToken));
        invite.setStatus(InviteStatus.PENDING);
        invite.setExpires_at(LocalDateTime.now().plusDays(expirationDays));
        // Reseta os marcadores de consumo de uma eventual tentativa anterior — senão o
        // token novo nunca conseguiria ser consumido (o UPDATE atômico exige consumed_at IS NULL).
        invite.setOpened_at(null);
        invite.setConsumed_at(null);
        invite.setUpdated_at(LocalDate.now());

        questionnaireInviteRepository.save(invite);

        String inviteLink = baseUrl + "/convite/" + rawToken;

        mailService.sendQuestionnaireInvite(
                patient.getUser().getEmail(),
                patient.getUser().getName(),
                questionnaire.getTitle(),
                inviteLink,
                invite.getExpires_at()
        );

        invite.setStatus(InviteStatus.SENT);
        invite.setSent_at(LocalDateTime.now());
        questionnaireInviteRepository.save(invite);

        return inviteMapper.toResponse(invite, inviteLink);
    }
}
