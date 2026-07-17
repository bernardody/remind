package br.com.remind.service.questionnaire;

import br.com.remind.controller.response.questionnaire.GetPatientQuestionnaireEvolutionResponse;
import br.com.remind.controller.response.questionnaire.GetPatientQuestionnaireEvolutionResponse.ApplicationResult;
import br.com.remind.controller.response.questionnaire.GetPatientQuestionnaireEvolutionResponse.ScaleEvolutionResult;
import br.com.remind.domain.*;
import br.com.remind.enums.EvolutionTrend;
import br.com.remind.mapper.questionnaire.GetPatientQuestionnaireEvolutionMapper;
import br.com.remind.repository.*;
import br.com.remind.service.user.AuthenticatedUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Histórico completo de aplicações de um questionário por um paciente, com tendência por escala
 * entre rodadas consecutivas (docs/specs/003-relatorios-evolucao-longitudinal/PRD.md §4.4) —
 * fonte de dados da tela de relatórios (linha do tempo, gráficos de evolução por escala).
 */
@RequiredArgsConstructor
@Service
public class GetPatientQuestionnaireEvolutionService {

    /** Delta abaixo do qual, em caso de empate de faixa de risco, a variação é tratada como ruído. */
    private static final BigDecimal STABILITY_EPSILON = BigDecimal.valueOf(0.2);

    private final QuestionnaireRepository questionnaireRepository;
    private final QuestionnaireAnswerRepository questionnaireAnswerRepository;
    private final QuestionnaireResultRepository questionnaireResultRepository;
    private final QuestionnaireScaleResultRepository questionnaireScaleResultRepository;
    private final ScaleRiskBandRepository scaleRiskBandRepository;
    private final PatientRepository patientRepository;
    private final PsychologistRepository psychologistRepository;
    private final AuthenticatedUserService authenticatedUserService;
    private final GetPatientQuestionnaireEvolutionMapper getPatientQuestionnaireEvolutionMapper;

    public GetPatientQuestionnaireEvolutionResponse get(Long questionnaireId, Long patientId) {
        User authenticatedUser = authenticatedUserService.get();

        Psychologist psychologist = psychologistRepository.findByUser(authenticatedUser)
                .orElseThrow(() -> new ResponseStatusException(HttpStatusCode.valueOf(404), "Psicólogo não encontrado"));

        Questionnaire questionnaire = questionnaireRepository.findByIdAndActiveTrue(questionnaireId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatusCode.valueOf(404), "Questionário não encontrado"));

        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatusCode.valueOf(404), "Paciente não encontrado"));

        if (!patient.getPsychologist().equals(psychologist)) {
            throw new ResponseStatusException(HttpStatusCode.valueOf(403), "Você não tem permissão para ver a evolução deste paciente");
        }

        // Base já vem desc (mesma query usada pro resultado "atual") — inverte pra montar a linha
        // do tempo em ordem cronológica e comparar rodada N com N-1.
        List<QuestionnaireAnswer> answers = new ArrayList<>(questionnaireAnswerRepository
                .findAllByPatientAndQuestionnaireOrderByAnsweredAtDesc(patient, questionnaire));
        Collections.reverse(answers);

        if (answers.isEmpty()) {
            throw new ResponseStatusException(HttpStatusCode.valueOf(404), "Paciente ainda não respondeu este questionário");
        }

        List<QuestionnaireResult> results = questionnaireResultRepository.findByQuestionnaireResponseIn(answers);
        Map<Long, QuestionnaireResult> resultByAnswerId = results.stream()
                .collect(Collectors.toMap(r -> r.getQuestionnaireResponse().getId(), r -> r));

        List<QuestionnaireScaleResult> allScaleResults = questionnaireScaleResultRepository
                .findByQuestionnaireResultIn(results);
        Map<Long, List<QuestionnaireScaleResult>> scaleResultsByResultId = allScaleResults.stream()
                .collect(Collectors.groupingBy(sr -> sr.getQuestionnaireResult().getId()));

        Map<Long, List<ScaleRiskBand>> bandsByScaleId = new HashMap<>();
        Map<Long, BigDecimal> previousAverageByScale = new HashMap<>();

        List<ApplicationResult> applications = new ArrayList<>();

        for (QuestionnaireAnswer answer : answers) {
            QuestionnaireResult result = resultByAnswerId.get(answer.getId());
            if (result == null) continue; // defensivo: cálculo do resultado é síncrono na resposta, não deveria faltar

            List<QuestionnaireScaleResult> roundScaleResults = scaleResultsByResultId
                    .getOrDefault(result.getId(), List.of());

            List<ScaleEvolutionResult> scaleEvolutions = new ArrayList<>();

            for (QuestionnaireScaleResult scaleResult : roundScaleResults) {
                Long scaleId = scaleResult.getScale().getId();
                List<ScaleRiskBand> bandsAscending = bandsByScaleId.computeIfAbsent(scaleId,
                        id -> scaleRiskBandRepository.findByScaleAndActiveTrue(scaleResult.getScale()).stream()
                                .sorted(Comparator.comparing(ScaleRiskBand::getMin_value))
                                .toList());

                EvolutionTrend trend = classifyTrend(
                        previousAverageByScale.get(scaleId), scaleResult.getAverage(), bandsAscending);

                scaleEvolutions.add(ScaleEvolutionResult.builder()
                        .scaleId(scaleId)
                        .scaleName(scaleResult.getScale().getName())
                        .average(scaleResult.getAverage())
                        .riskLabel(scaleResult.getRisk_label())
                        .trend(trend)
                        .build());

                previousAverageByScale.put(scaleId, scaleResult.getAverage());
            }

            applications.add(ApplicationResult.builder()
                    .questionnaireAnswerId(answer.getId())
                    .answeredAt(answer.getAnswered_at())
                    .average(result.getAverage())
                    .scaleResults(scaleEvolutions)
                    .build());
        }

        return getPatientQuestionnaireEvolutionMapper.toResponse(patient, questionnaire, applications);
    }

    /**
     * Cruzamento de faixa de risco é o critério primário — mais confiável que delta bruto dado o
     * viés de resposta Likert em adolescentes (PRD.md raiz §3.6). Delta numérico com epsilon só
     * decide em caso de empate de faixa. Sem rodada anterior (1ª aplicação) não há tendência.
     */
    private EvolutionTrend classifyTrend(BigDecimal previousAverage, BigDecimal currentAverage, List<ScaleRiskBand> bandsAscending) {
        if (previousAverage == null) return null;

        int previousRank = bandRank(previousAverage, bandsAscending);
        int currentRank = bandRank(currentAverage, bandsAscending);

        if (currentRank != previousRank) {
            return currentRank > previousRank ? EvolutionTrend.PIORA : EvolutionTrend.MELHORA;
        }

        BigDecimal delta = currentAverage.subtract(previousAverage);
        if (delta.abs().compareTo(STABILITY_EPSILON) < 0) return EvolutionTrend.ESTAVEL;
        return delta.compareTo(BigDecimal.ZERO) > 0 ? EvolutionTrend.PIORA : EvolutionTrend.MELHORA;
    }

    /**
     * Posição (índice) da maior faixa cujo piso a média atinge — mesma regra de
     * {@code QuestionnaireResultCalculator#classify}. Maior índice = mais risco, já que as faixas
     * chegam ordenadas por {@code min_value} ascendente. -1 se a média não atinge nenhuma faixa
     * (sem faixas cadastradas para a escala).
     */
    private int bandRank(BigDecimal average, List<ScaleRiskBand> bandsAscending) {
        int rank = -1;
        for (int i = 0; i < bandsAscending.size(); i++) {
            if (average.compareTo(bandsAscending.get(i).getMin_value()) >= 0) {
                rank = i;
            }
        }
        return rank;
    }
}
