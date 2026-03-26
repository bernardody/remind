package br.com.remind.service.questionnaire;

import br.com.remind.controller.response.questionnaire.QuestionnaireResponse;
import br.com.remind.domain.Questionnaire;
import br.com.remind.mapper.questionnaire.ListQuestionnaireMapper;
import br.com.remind.repository.QuestionnaireRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@RequiredArgsConstructor
@Service
public class ListQuestionnaireService {

    private final QuestionnaireRepository questionnaireRepository;

    public Page<QuestionnaireResponse> list(Pageable pageable) {
        Page<Questionnaire> questionnaires = questionnaireRepository.findAllByActiveTrue(pageable);
        return questionnaires.map(ListQuestionnaireMapper::toResponse);
    }
}
