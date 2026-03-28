package br.com.remind.repository;

import br.com.remind.domain.Psychologist;
import br.com.remind.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PsychologistRepository extends JpaRepository<Psychologist, Long> {
    Optional<Psychologist> findByUser(User user);
}