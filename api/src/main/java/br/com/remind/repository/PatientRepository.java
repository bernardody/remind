package br.com.remind.repository;

import br.com.remind.domain.Patient;
import br.com.remind.domain.Psychologist;
import br.com.remind.domain.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PatientRepository extends JpaRepository<Patient, Long> {
    Page<Patient> findByPsychologistAndActiveTrue(Psychologist psychologist, Pageable pageable);
    Optional<Patient> findByUserAndActiveTrue(User user);
    Optional<Patient> findByIdAndPsychologistAndActiveTrue(Long id, Psychologist psychologist);
}