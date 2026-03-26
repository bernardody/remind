package br.com.remind.controller.response.question;

import br.com.remind.controller.response.option.OptionResponse;
import br.com.remind.domain.Scale;
import lombok.*;

import java.util.List;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class QuestionResponse {

    private Long id;
    private Scale scale;
    private String text;
    private Integer order_number;
    private List<OptionResponse> options;
}
