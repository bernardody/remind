package br.com.remind.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

import static jakarta.persistence.GenerationType.IDENTITY;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@EqualsAndHashCode(of = "id")
@ToString(of = "id")
@Entity
@Table(name = "scale_risk_bands")
public class ScaleRiskBand {

    @Id
    @GeneratedValue(strategy = IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne
    @JoinColumn(name = "id_scale", nullable = false)
    private Scale scale;

    @NotBlank
    private String label;

    @NotNull
    private BigDecimal min_value;

    @NotNull
    private BigDecimal max_value;

    @NotNull
    private LocalDate created_at;

    @NotNull
    private LocalDate updated_at;

    @NotNull
    private Boolean active;
}
