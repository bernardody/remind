package br.com.remind.controller.response.invite;

import lombok.*;

import java.time.LocalDateTime;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class InviteResponse {

    private Long id;
    private String status;
    private LocalDateTime expiresAt;

    /** Só preenchido na criação/reenvio — o token em claro nunca é persistido nem reexibido depois (PRD §16). */
    private String inviteLink;
}
