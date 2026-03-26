package br.com.remind.service.questionnaire;

import br.com.remind.controller.response.questionnaire.GetQuestionnaireResponse;
import br.com.remind.domain.Question;
import br.com.remind.domain.QuestionOption;
import br.com.remind.domain.Questionnaire;
import br.com.remind.mapper.questionnaire.GetQuestionnaireMapper;
import br.com.remind.repository.QuestionOptionRepository;
import br.com.remind.repository.QuestionRepository;
import br.com.remind.repository.QuestionnaireRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Service
public class GetQuestionnaireService {

    private final QuestionnaireRepository questionnaireRepository;
    private final QuestionRepository questionRepository;
    private final QuestionOptionRepository questionOptionRepository;

    public GetQuestionnaireResponse byId(Long id) {
        Questionnaire questionnaire = questionnaireRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Questionário não encontrado"));

        List<Question> questions = questionRepository.findByQuestionnaireId(questionnaire.getId());

        List<Long> questionIds = questions.stream()
                .map(Question::getId)
                .toList();

        List<QuestionOption> options = questionOptionRepository.findByQuestionIdIn(questionIds);

        Map<Long, List<QuestionOption>> optionsByQuestion =
                options.stream()
                        .collect(Collectors.groupingBy(o -> o.getQuestion().getId()));

        return GetQuestionnaireMapper.toResponse(questionnaire, questions, optionsByQuestion);
    }
}
