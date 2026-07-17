package br.com.remind.service.invite;

import br.com.remind.domain.Patient;
import br.com.remind.domain.Psychologist;
import br.com.remind.domain.Questionnaire;
import br.com.remind.domain.QuestionnaireInvite;
import br.com.remind.domain.User;
import br.com.remind.enums.InviteStatus;
import br.com.remind.mapper.invite.InviteMapper;
import br.com.remind.repository.PatientRepository;
import br.com.remind.repository.PsychologistRepository;
import br.com.remind.repository.QuestionnaireInviteRepository;
import br.com.remind.repository.QuestionnaireRepository;
import br.com.remind.service.mail.MailService;
import br.com.remind.service.user.AuthenticatedUserService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.Mockito.when;

/**
 * Cobre a remoção do INV-004 (docs/specs/003-relatorios-evolucao-longitudinal/PRD.md §4.2):
 * reenviar convite pra um paciente que já respondeu deixa de ser erro e passa a ser o mecanismo
 * oficial de reaplicação.
 */
@ExtendWith(MockitoExtension.class)
class CreateInviteServiceTest {

    @Mock private PatientRepository patientRepository;
    @Mock private PsychologistRepository psychologistRepository;
    @Mock private QuestionnaireRepository questionnaireRepository;
    @Mock private QuestionnaireInviteRepository questionnaireInviteRepository;
    @Mock private AuthenticatedUserService authenticatedUserService;
    @Spy private InviteTokenGenerator inviteTokenGenerator = new InviteTokenGenerator();
    @Mock private MailService mailService;
    @Mock private InviteMapper inviteMapper;

    @InjectMocks
    private CreateInviteService createInviteService;

    @Test
    void create_forPatientWhoAlreadyAnswered_doesNotThrow_andReusesExistingInvite() {
        User psychologistUser = User.builder().id(1L).build();
        Psychologist psychologist = Psychologist.builder().id(5L).build();
        Patient patient = Patient.builder().id(10L)
                .user(User.builder().name("Paciente").email("p@x.com").build())
                .build();
        Questionnaire questionnaire = Questionnaire.builder().id(100L).title("Questionário 1").build();
        QuestionnaireInvite previouslyAnswered = QuestionnaireInvite.builder()
                .patient(patient).questionnaire(questionnaire).psychologist(psychologist)
                .status(InviteStatus.ANSWERED).active(true).build();

        when(authenticatedUserService.get()).thenReturn(psychologistUser);
        when(psychologistRepository.findByUser(psychologistUser)).thenReturn(Optional.of(psychologist));
        when(patientRepository.findByIdAndPsychologistAndActiveTrue(10L, psychologist)).thenReturn(Optional.of(patient));
        when(questionnaireRepository.findByIdAndActiveTrue(100L)).thenReturn(Optional.of(questionnaire));
        when(questionnaireInviteRepository.findByPatientAndQuestionnaireAndActiveTrue(patient, questionnaire))
                .thenReturn(Optional.of(previouslyAnswered));

        assertThatCode(() -> createInviteService.create(10L, 100L)).doesNotThrowAnyException();

        // Mesmo registro é reaproveitado (INV-002) e volta pro início do ciclo de vida — não cria
        // um segundo convite pro mesmo par paciente/questionário.
        assertThat(previouslyAnswered.getStatus()).isEqualTo(InviteStatus.SENT);
        assertThat(previouslyAnswered.getConsumed_at()).isNull();
        assertThat(previouslyAnswered.getOpened_at()).isNull();
    }
}
