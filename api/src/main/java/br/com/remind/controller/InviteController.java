package br.com.remind.controller;

import br.com.remind.controller.request.invite.ConsumeInviteRequest;
import br.com.remind.controller.response.invite.ConsumeInviteResponse;
import br.com.remind.controller.response.invite.InviteResponse;
import br.com.remind.service.invite.ConsumeInviteService;
import br.com.remind.service.invite.ResendInviteService;
import br.com.remind.service.invite.RevokeInviteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RequiredArgsConstructor
@RestController
@RequestMapping("/convites")
public class InviteController {

    private final ResendInviteService resendInviteService;
    private final RevokeInviteService revokeInviteService;
    private final ConsumeInviteService consumeInviteService;

    @PostMapping("/{id}/reenviar")
    public InviteResponse resend(@PathVariable Long id) {
        return resendInviteService.resend(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void revoke(@PathVariable Long id) {
        revokeInviteService.revoke(id);
    }

    /** Público (sem autenticação prévia) — o paciente ainda não tem sessão ao clicar o link. */
    @PostMapping("/consumir")
    public ConsumeInviteResponse consume(@RequestBody @Valid ConsumeInviteRequest request) {
        return consumeInviteService.consume(request.getToken());
    }
}
