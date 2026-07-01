package br.com.remind.domain;

import br.com.remind.enums.UserType;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
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
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = IDENTITY)
    private Long id;

    @NotBlank
    private String name;

    @Email
    @NotBlank
    private String email;

    private String cpf;

    private String phone;

    private String password;

    @NotNull
    @Enumerated(EnumType.STRING)
    private UserType type;

    @Column(unique = true)
    private String googleSub;

    @NotNull
    @Builder.Default
    private Boolean profileComplete = false;

    @NotNull
    private LocalDate created_at;

    @NotNull
    private LocalDate updated_at;

    @NotNull
    private Boolean active;
}
