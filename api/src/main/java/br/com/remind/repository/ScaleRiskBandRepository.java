package br.com.remind.repository;

import br.com.remind.domain.Scale;
import br.com.remind.domain.ScaleRiskBand;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ScaleRiskBandRepository extends JpaRepository<ScaleRiskBand, Long> {
    List<ScaleRiskBand> findByScaleAndActiveTrue(Scale scale);
}
