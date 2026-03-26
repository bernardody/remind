package br.com.remind.repository;

import br.com.remind.domain.Questionnaire;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuestionnaireRepository extends JpaRepository<Questionnaire, Long> {

    Page<Questionnaire> findAllByActiveTrue(Pageable pageable);
}
