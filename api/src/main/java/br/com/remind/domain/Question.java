package br.com.remind.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
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
@Table(name = "questions")
public class Question {

    @Id
    @GeneratedValue(strategy = IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne
    @JoinColumn(name = "id_questionnaire", nullable = false)
    private Questionnaire questionnaire;

    @NotNull
    @ManyToOne
    @JoinColumn(name = "id_scale", nullable = false)
    private Scale scale;

    @NotBlank
    private String text;

    @NotNull
    private Integer order_number;

    @NotNull
    private LocalDate created_at;

    private LocalDate updated_at;

    @NotNull
    private Boolean active;
}
