package br.com.remind.controller;

import br.com.remind.controller.request.password.ChangePasswordRequest;
import br.com.remind.controller.request.psychologist.CompleteProfileRequest;
import br.com.remind.controller.response.psychologist.CompleteProfileResponse;
import br.com.remind.controller.response.psychologist.MyProfileResponse;
import br.com.remind.domain.User;
import br.com.remind.service.password.ChangePasswordService;
import br.com.remind.service.psychologist.CompleteProfileService;
import br.com.remind.service.user.AuthenticatedUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RequiredArgsConstructor
@RestController
@RequestMapping("/psychologists")
public class PsychologistController {

    private final CompleteProfileService completeProfileService;
    private final AuthenticatedUserService authenticatedUserService;
    private final ChangePasswordService changePasswordService;

    @PutMapping("/me/profile")
    public CompleteProfileResponse completeProfile(@RequestBody @Valid CompleteProfileRequest request) {
        return completeProfileService.complete(request);
    }

    @GetMapping("/me/profile")
    public MyProfileResponse myProfile() {
        User user = authenticatedUserService.get();
        return new MyProfileResponse(
                user.getName(),
                user.getEmail(),
                user.getType(),
                Boolean.TRUE.equals(user.getProfileComplete())
        );
    }

    @PutMapping("/me/password")
    public void changePassword(@RequestBody @Valid ChangePasswordRequest request) {
        changePasswordService.change(request.getCurrentPassword(), request.getNewPassword());
    }
}
