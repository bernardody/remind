package br.com.remind.controller.response.login;

import br.com.remind.enums.UserType;

public record LoginResponse(String accessToken, Long expiresIn, UserType type, boolean profileComplete) {
}
