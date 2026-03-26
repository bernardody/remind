package br.com.remind.controller.response.option;

import lombok.*;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class OptionResponse {

    private Long id;
    private String name;
    private Integer value;
}
