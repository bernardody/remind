package br.com.remind.mapper.invite;

import br.com.remind.controller.response.invite.InviteResponse;
import br.com.remind.domain.QuestionnaireInvite;
import org.springframework.stereotype.Component;

@Component
public class InviteMapper {

    public InviteResponse toResponse(QuestionnaireInvite invite, String inviteLink) {
        return new InviteResponse(
                invite.getId(),
                invite.getStatus().name(),
                invite.getExpires_at(),
                inviteLink
        );
    }
}
