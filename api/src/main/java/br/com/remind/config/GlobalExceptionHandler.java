package br.com.remind.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatusException(
            ResponseStatusException ex,
            HttpServletRequest request) {

        HttpStatus statusCode = HttpStatus.valueOf(ex.getStatusCode().value());
        String error = statusCode.getReasonPhrase();

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

        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", statusCode.value());
        body.put("error", error);
        body.put("message", ex.getMessage());
        body.put("path", request.getServletPath());

        return ResponseEntity.status(statusCode).body(body);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(
            RuntimeException ex,
            HttpServletRequest request) {

        HttpStatus statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        String error = statusCode.getReasonPhrase();

        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", statusCode.value());
        body.put("error", error);
        body.put("message", ex.getMessage());
        body.put("path", request.getServletPath());

        return ResponseEntity.status(statusCode).body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(
            Exception ex,
            HttpServletRequest request) {

        HttpStatus statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        String error = statusCode.getReasonPhrase();

        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", statusCode.value());
        body.put("error", error);
        body.put("message", ex.getMessage() != null ? ex.getMessage() : "Erro interno do servidor");
        body.put("path", request.getServletPath());

        return ResponseEntity.status(statusCode).body(body);
    }
}
