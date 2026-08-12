package br.com.remind.service.invite;

import br.com.remind.controller.response.invite.ConsumeInviteResponse;
import br.com.remind.domain.QuestionnaireInvite;
import br.com.remind.enums.InviteStatus;
import br.com.remind.repository.QuestionnaireInviteRepository;
import br.com.remind.service.login.AccessTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.GONE;
import static org.springframework.http.HttpStatus.NOT_FOUND;

/**
 * Consome um token de convite e emite um JWT de escopo restrito ao questionário do convite
 * (INV-008, INV-012 — docs/specs/002-convite-questionario/PRD.md §16). Reabrir o mesmo link
 * várias vezes é permitido enquanto o questionário não tiver sido respondido — o uso único de
 * fato acontece na resposta, não no consumo do link (ver
 * {@link br.com.remind.repository.QuestionnaireInviteRepository#consumeByTokenHash}).
 */
@RequiredArgsConstructor
@Service
public class ConsumeInviteService {

    private final QuestionnaireInviteRepository questionnaireInviteRepository;
    private final InviteTokenGenerator inviteTokenGenerator;
    private final AccessTokenService accessTokenService;

    @Transactional
    public ConsumeInviteResponse consume(String rawToken) {
        String tokenHash = inviteTokenGenerator.hash(rawToken);

        // Buscado ANTES da tentativa de consumo: reflete o estado no momento da tentativa,
        // usado só para diagnosticar por que o UPDATE atômico abaixo não afetou nenhuma
        // linha (já respondido / revogado / expirado) — nunca para decidir se o consumo
        // em si é válido, isso é responsabilidade exclusiva do UPDATE condicional.
        QuestionnaireInvite invite = questionnaireInviteRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Convite não encontrado."));

        LocalDateTime now = LocalDateTime.now();
        int consumed = questionnaireInviteRepository.consumeByTokenHash(tokenHash, now, now.toLocalDate());

        if (consumed == 0) {
            if (invite.getStatus() == InviteStatus.ANSWERED) {
                throw new ResponseStatusException(CONFLICT, "Você já respondeu este questionário.");
            }
            if (invite.getStatus() == InviteStatus.REVOKED || !Boolean.TRUE.equals(invite.getActive())) {
                throw new ResponseStatusException(GONE, "Este convite não está mais disponível.");
            }
            throw new ResponseStatusException(GONE, "Este link expirou. Peça um novo convite ao seu psicólogo.");
        }

        Jwt scopedJwt = accessTokenService.generateInviteScoped(
                invite.getPatient().getUser(),
                invite.getQuestionnaire().getId());

        return ConsumeInviteResponse.builder()
                .accessToken(scopedJwt.getTokenValue())
                .expiresIn(AccessTokenService.INVITE_EXPIRES_IN)
                .questionnaireId(invite.getQuestionnaire().getId())
                .questionnaireTitle(invite.getQuestionnaire().getTitle())
                .build();
    }
}
