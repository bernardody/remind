package br.com.remind.controller;

import br.com.remind.controller.request.questionnaire.AnswerQuestionnaireRequest;
import br.com.remind.controller.response.invite.ListPatientInviteResponse;
import br.com.remind.controller.response.patient.ListPatientQuestionnaireResponse;
import br.com.remind.controller.response.questionnaire.*;
import br.com.remind.service.invite.ListMyInvitesService;
import br.com.remind.service.questionnaire.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

@RequiredArgsConstructor
@RestController
@RequestMapping("/questionarios")
public class QuestionnaireController {

    private final ListQuestionnaireService listQuestionnaireService;
    private final GetQuestionnaireService getQuestionnaireService;
    private final AnswerQuestionnaireService answerQuestionnaireService;
    private final ListQuestionnairePatientService listQuestionnairePatientService;
    private final GetPatientQuestionnaireAnswersService getPatientQuestionnaireAnswersService;
    private final GetPatientQuestionnaireResultService getPatientQuestionnaireResultService;
    private final GetPatientQuestionnaireEvolutionService getPatientQuestionnaireEvolutionService;
    private final ListMyQuestionnairesService listMyQuestionnairesService;
    private final GetMyQuestionnaireResultService getMyQuestionnaireResultService;
    private final ListMyInvitesService listMyInvitesService;

    @GetMapping
    public Page<QuestionnaireResponse> listQuestionnaires(Pageable pageable) {
        return listQuestionnaireService.list(pageable);
    }

    /** Auto-serviço do paciente: questionários que ele mesmo já respondeu (via JWT, sem patientId). */
    @GetMapping("/respondidos")
    public Page<ListPatientQuestionnaireResponse> listMyAnsweredQuestionnaires(Pageable pageable) {
        return listMyQuestionnairesService.list(pageable);
    }

    /**
     * Auto-serviço do paciente: seus próprios convites (via JWT, sem patientId) — base da tela
     * "Início" (docs/specs/003-relatorios-evolucao-longitudinal/PRD.md §4.5/§5.1), que deixa de
     * listar o catálogo global e passa a listar só o que o paciente tem convite.
     */
    @GetMapping("/convites")
    public Page<ListPatientInviteResponse> listMyInvites(Pageable pageable) {
        return listMyInvitesService.list(pageable);
    }

    @GetMapping("/{id}")
    public GetQuestionnaireResponse getQuestionnaire(@PathVariable Long id) {
        return getQuestionnaireService.byId(id);
    }

    @PostMapping("/{id}/responder")
    public AnswerQuestionnaireResponse answer(@PathVariable Long id,
                                              @RequestBody @Valid AnswerQuestionnaireRequest request) {
        return answerQuestionnaireService.answer(id, request);
    }

    @GetMapping("/{id}/pacientes")
    public Page<ListQuestionnairePatientResponse> listPatients(@PathVariable Long id, Pageable pageable) {
        return listQuestionnairePatientService.list(id, pageable);
    }

    @GetMapping("/{id}/pacientes/{patientId}/respostas")
    public GetPatientQuestionnaireAnswersResponse getAnswers(@PathVariable Long id,
                                                             @PathVariable Long patientId,
                                                             @RequestParam(required = false) Long answerId) {
        return getPatientQuestionnaireAnswersService.get(id, patientId, answerId);
    }

    @GetMapping("/{id}/pacientes/{patientId}/resultado")
    public GetPatientQuestionnaireResultResponse getResult(@PathVariable Long id,
                                                           @PathVariable Long patientId) {
        return getPatientQuestionnaireResultService.get(id, patientId);
    }

    /** Histórico completo de aplicações do paciente, com tendência por escala (RF-17, relatórios). */
    @GetMapping("/{id}/pacientes/{patientId}/evolucao")
    public GetPatientQuestionnaireEvolutionResponse getEvolution(@PathVariable Long id,
                                                                  @PathVariable Long patientId) {
        return getPatientQuestionnaireEvolutionService.get(id, patientId);
    }

    /** Auto-serviço do paciente: seu próprio resultado (via JWT, sem patientId). */
    @GetMapping("/{id}/resultado")
    public GetPatientQuestionnaireResultResponse getMyResult(@PathVariable Long id) {
        return getMyQuestionnaireResultService.get(id);
    }
}
