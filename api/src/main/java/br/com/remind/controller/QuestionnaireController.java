package br.com.remind.controller;

import br.com.remind.controller.response.questionnaire.GetQuestionnaireResponse;
import br.com.remind.controller.response.questionnaire.QuestionnaireResponse;
import br.com.remind.service.questionnaire.GetQuestionnaireService;
import br.com.remind.service.questionnaire.ListQuestionnaireService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RequiredArgsConstructor
@RestController
@RequestMapping("/questionarios")
public class QuestionnaireController {

    private final ListQuestionnaireService listQuestionnaireService;
    private final GetQuestionnaireService getQuestionnaireService;

    @GetMapping
    public Page<QuestionnaireResponse> listQuestionnaires(Pageable pageable) {
        return listQuestionnaireService.list(pageable);
    }

    @GetMapping("/{id}")
    public GetQuestionnaireResponse getQuestionnaire(@PathVariable Long id) {
        return getQuestionnaireService.byId(id);
    }
}
