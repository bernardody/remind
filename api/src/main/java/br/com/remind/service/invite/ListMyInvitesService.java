package br.com.remind.service.invite;

import br.com.remind.controller.response.invite.ListPatientInviteResponse;
import br.com.remind.domain.Patient;
import br.com.remind.domain.QuestionnaireInvite;
import br.com.remind.domain.User;
import br.com.remind.mapper.invite.InviteMapper;
import br.com.remind.repository.PatientRepository;
import br.com.remind.repository.QuestionnaireInviteRepository;
import br.com.remind.service.user.AuthenticatedUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.springframework.http.HttpStatus.NOT_FOUND;

/**
 * Auto-serviço do paciente: seus próprios convites (docs/specs/003-relatorios-evolucao-longitudinal/
 * PRD.md §4.5) — base da tela "Início", que deixa de listar o catálogo global de questionários
 * (`ListQuestionnaireService`) e passa a listar só o que o paciente tem convite (vivo ou já
 * respondido). Reaproveita o mesmo repositório/mapper já usados por `ListPatientInvitesService`
 * (visão do psicólogo) — só troca a resolução do paciente de `patientId` (path) pra JWT.
 *
 * <p>Chamado também por sessões de convite (escopo restrito a 1 questionário, ver
 * {@link br.com.remind.config.InviteScopedAuthorizationFilter}) — é assim que a página do
 * wizard descobre o estado do próprio convite (docs/specs/003-relatorios-evolucao-longitudinal/
 * PRD.md §4.1). Nesse caso o retorno é restrito ao convite do escopo: devolver a lista
 * completa vazaria a existência de outros convites/questionários do paciente pra uma sessão
 * que só deveria enxergar o questionário pro qual foi emitida.
 */
@RequiredArgsConstructor
@Service
public class ListMyInvitesService {

    private final PatientRepository patientRepository;
    private final QuestionnaireInviteRepository questionnaireInviteRepository;
    private final AuthenticatedUserService authenticatedUserService;
    private final InviteMapper inviteMapper;

    public Page<ListPatientInviteResponse> list(Pageable pageable) {
        User authenticatedUser = authenticatedUserService.get();

        Patient patient = patientRepository.findByUserAndActiveTrue(authenticatedUser)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Paciente não encontrado"));

        Optional<Long> scopedQuestionnaireId = authenticatedUserService.getInviteScopedQuestionnaireId();

        Page<QuestionnaireInvite> invites = scopedQuestionnaireId
                .map(questionnaireId -> questionnaireInviteRepository
                        .findByPatientAndQuestionnaire_IdAndActiveTrue(patient, questionnaireId, pageable))
                .orElseGet(() -> questionnaireInviteRepository.findByPatientAndActiveTrue(patient, pageable));

        return invites.map(inviteMapper::toListResponse);
    }
}
