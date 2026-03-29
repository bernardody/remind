package br.com.remind.controller;

import br.com.remind.controller.request.questionnaire.AnswerQuestionnaireRequest;
import br.com.remind.controller.response.questionnaire.*;
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

    @GetMapping
    public Page<QuestionnaireResponse> listQuestionnaires(Pageable pageable) {
        return listQuestionnaireService.list(pageable);
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
                                                             @PathVariable Long patientId) {
        return getPatientQuestionnaireAnswersService.get(id, patientId);
    }

    @GetMapping("/{id}/pacientes/{patientId}/resultado")
    public GetPatientQuestionnaireResultResponse getResult(@PathVariable Long id,
                                                           @PathVariable Long patientId) {
        return getPatientQuestionnaireResultService.get(id, patientId);
    }
}
