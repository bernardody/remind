package br.com.remind.mapper.option;

import br.com.remind.controller.response.option.OptionResponse;
import br.com.remind.domain.QuestionOption;
import org.springframework.stereotype.Component;

@Component
public class OptionMapper {
    public static OptionResponse toResponse(QuestionOption option) {
        return OptionResponse.builder()
                .id(option.getId())
                .name(option.getName())
                .value(option.getValue())
                .build();
    }
}
