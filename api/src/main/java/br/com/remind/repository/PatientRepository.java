package br.com.remind.repository;

import br.com.remind.domain.Patient;
import br.com.remind.domain.Psychologist;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PatientRepository extends JpaRepository<Patient, Long> {
    Page<Patient> findByPsychologistAndActiveTrue(Psychologist psychologist, Pageable pageable);
}