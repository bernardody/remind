package br.com.remind.service.login;

import br.com.remind.controller.response.user.UserResponse;
import br.com.remind.repository.UserRepository;
import br.com.remind.domain.User;
import br.com.remind.mapper.user.ListUserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Optional;

@RequiredArgsConstructor
@Service
public class SearchUserService {

    private final UserRepository userRepository;

    public Page<UserResponse> search(String text, Pageable pageable) {
        return userRepository.findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
                text, text, pageable
        ).map(ListUserMapper::toResponse);
    }

    public Optional<User> searchByEmail(String email) {
        return userRepository.findByEmail(email);
    }
}
