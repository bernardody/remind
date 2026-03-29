package br.com.remind.repository;

import br.com.remind.domain.Questionnaire;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface QuestionnaireRepository extends JpaRepository<Questionnaire, Long> {
    Optional<Questionnaire> findByIdAndActiveTrue(Long id);
    Page<Questionnaire> findAllByActiveTrue(Pageable pageable);
}