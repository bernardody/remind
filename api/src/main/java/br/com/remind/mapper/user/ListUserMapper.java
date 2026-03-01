package br.com.remind.mapper.user;

import br.com.remind.controller.response.user.UserResponse;
import br.com.remind.domain.User;

public class ListUserMapper {
    public static UserResponse toResponse(User entity) {
        return UserResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .email(entity.getEmail())
                .type(entity.getType())
                .build();
    }
}
