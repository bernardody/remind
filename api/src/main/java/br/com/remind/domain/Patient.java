package br.com.remind.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

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
@Table(name = "patients")
public class Patient {

    @Id
    @GeneratedValue(strategy = IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne
    @JoinColumn(name = "id_user", nullable = false)
    private User user;

    @NotNull
    @ManyToOne
    @JoinColumn(name = "id_psychologist", nullable = false)
    private Psychologist psychologist;

    @NotNull
    private LocalDate birth_date;

    @NotNull
    private Character gender;

    @NotNull
    private LocalDate created_at;

    @NotNull
    private LocalDate updated_at;

    @NotNull
    private Boolean active;
}
