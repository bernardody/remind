package br.com.remind.mapper.invite;

import br.com.remind.controller.response.invite.InviteResponse;
import br.com.remind.controller.response.invite.ListPatientInviteResponse;
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

    /** Sem link/token — só a hash é persistida, não há como reexibir o valor em claro (PRD §16). */
    public ListPatientInviteResponse toListResponse(QuestionnaireInvite invite) {
        return ListPatientInviteResponse.builder()
                .id(invite.getId())
                .questionnaireId(invite.getQuestionnaire().getId())
                .questionnaireTitle(invite.getQuestionnaire().getTitle())
                .status(invite.getStatus().name())
                .expiresAt(invite.getExpires_at())
                .sentAt(invite.getSent_at())
                .openedAt(invite.getOpened_at())
                .build();
    }
}
