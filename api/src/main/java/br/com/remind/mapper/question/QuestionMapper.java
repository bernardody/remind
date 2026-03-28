package br.com.remind.mapper.question;

import br.com.remind.controller.response.option.OptionResponse;
import br.com.remind.controller.response.question.QuestionResponse;
import br.com.remind.domain.Question;
import br.com.remind.domain.QuestionOption;
import br.com.remind.mapper.option.OptionMapper;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class QuestionMapper {
    public static QuestionResponse toResponse(
            Question question,
            List<QuestionOption> options
    ) {

        List<OptionResponse> optionResponses = options.stream()
                .map(OptionMapper::toResponse)
                .toList();

        return QuestionResponse.builder()
                .id(question.getId())
                .scale(question.getScale())
                .text(question.getText())
                .order_number(question.getOrder_number())
                .options(optionResponses)
                .build();
    }
}
