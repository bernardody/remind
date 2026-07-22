package br.com.remind.config;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatusException(
            ResponseStatusException ex,
            HttpServletRequest request) {

        HttpStatus statusCode = HttpStatus.valueOf(ex.getStatusCode().value());
        String error = statusCode.getReasonPhrase();

        // Mensagem definida deliberadamente pelo próprio código de negócio (ex: "E-mail já
        // cadastrado", "Convite expirado") — segura pra devolver ao cliente, ao contrário das
        // exceções não mapeadas abaixo. Log em WARN (sem stack trace) só pra dar visibilidade
        // de padrões (ex: muitos 403/404 seguidos de um mesmo IP).
        log.warn("{} {} -> {} {}", request.getMethod(), request.getServletPath(), statusCode.value(), ex.getReason());

        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", statusCode.value());
        body.put("error", error);
        body.put("message", ex.getReason());
        body.put("path", request.getServletPath());

        return ResponseEntity.status(statusCode).body(body);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgumentException(
            IllegalArgumentException ex,
            HttpServletRequest request) {

        HttpStatus statusCode = HttpStatus.BAD_REQUEST;
        String error = statusCode.getReasonPhrase();

        log.warn("{} {} -> {} {}", request.getMethod(), request.getServletPath(), statusCode.value(), ex.getMessage());

        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", statusCode.value());
        body.put("error", error);
        body.put("message", ex.getMessage());
        body.put("path", request.getServletPath());

        return ResponseEntity.status(statusCode).body(body);
    }

    /**
     * Falha de {@code @Valid} num {@code @RequestBody} — {@link MethodArgumentNotValidException}
     * estende {@code Exception} (não {@code RuntimeException}), então sem esse handler dedicado
     * caía no {@link #handleGenericException} e virava 500 com mensagem verbosa do Spring em vez
     * de 400 com os campos inválidos (ver PRODUCTION_AUDIT.md B-BE-2).
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(
            MethodArgumentNotValidException ex,
            HttpServletRequest request) {

        HttpStatus statusCode = HttpStatus.BAD_REQUEST;

        List<Map<String, String>> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .map(fieldError -> Map.of(
                        "field", fieldError.getField(),
                        "message", fieldError.getDefaultMessage() != null
                                ? fieldError.getDefaultMessage()
                                : "Valor inválido"))
                .toList();

        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", statusCode.value());
        body.put("error", statusCode.getReasonPhrase());
        body.put("message", "Dados inválidos.");
        body.put("errors", fieldErrors);
        body.put("path", request.getServletPath());

        return ResponseEntity.status(statusCode).body(body);
    }

    /**
     * Qualquer {@link RuntimeException}/{@link Exception} não mapeada acima é, por definição,
     * um erro não previsto pelo próprio código (NPE, erro de driver JDBC, etc.) — nunca deve
     * vazar {@code ex.getMessage()} pro cliente (pode conter nome de tabela/coluna/constraint,
     * detalhes de infraestrutura). Antes desta correção, nada aqui era logado: um 500 em
     * produção só era percebido se o usuário reclamasse (ver PRODUCTION_AUDIT.md B-BE-1).
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(
            RuntimeException ex,
            HttpServletRequest request) {

        log.error("Erro não tratado em {} {}", request.getMethod(), request.getServletPath(), ex);
        return unexpectedErrorResponse(request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(
            Exception ex,
            HttpServletRequest request) {

        log.error("Erro não tratado em {} {}", request.getMethod(), request.getServletPath(), ex);
        return unexpectedErrorResponse(request);
    }

    private ResponseEntity<Map<String, Object>> unexpectedErrorResponse(HttpServletRequest request) {
        HttpStatus statusCode = HttpStatus.INTERNAL_SERVER_ERROR;

        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", statusCode.value());
        body.put("error", statusCode.getReasonPhrase());
        body.put("message", "Erro interno do servidor.");
        body.put("path", request.getServletPath());

        return ResponseEntity.status(statusCode).body(body);
    }
}
