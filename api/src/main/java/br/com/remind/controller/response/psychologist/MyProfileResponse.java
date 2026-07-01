package br.com.remind.controller.response.psychologist;

import br.com.remind.enums.UserType;

/**
 * Leitura do próprio perfil — liberada mesmo para contas com perfil incompleto (REQ-013).
 */
public record MyProfileResponse(String name, String email, UserType type, boolean profileComplete) {
}
