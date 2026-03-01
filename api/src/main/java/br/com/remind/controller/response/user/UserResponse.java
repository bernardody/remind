package br.com.remind.controller.response.user;

import br.com.remind.enums.UserType;
import lombok.*;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class UserResponse {

    private Long id;
    private String name;
    private String email;
    private String phone;
    private UserType type;
}
