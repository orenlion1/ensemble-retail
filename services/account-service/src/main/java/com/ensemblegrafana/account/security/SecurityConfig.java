package com.ensemblegrafana.account.security;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.util.StringUtils;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.OncePerRequestFilter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Configuration
public class SecurityConfig {
  @Value("${ensemble.security.api-key:}")
  private String apiKey;

  @Value("${ensemble.security.jwt-enabled:false}")
  private boolean jwtEnabled;

  @Value("${ensemble.security.allowed-origins:}")
  private List<String> allowedOrigins;

  @Bean
  SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http.csrf(csrf -> csrf.disable())
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))
        .headers(headers -> headers
            .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'none'; frame-ancestors 'none'"))
            .frameOptions(frameOptions -> frameOptions.deny())
            .httpStrictTransportSecurity(hsts -> hsts.includeSubDomains(true).maxAgeInSeconds(31536000)))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/actuator/health/**").permitAll()
            .anyRequest().authenticated())
        .addFilterBefore(new ApiKeyAuthenticationFilter(apiKey), UsernamePasswordAuthenticationFilter.class);

    if (jwtEnabled) {
      JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
      converter.setJwtGrantedAuthoritiesConverter(jwt -> List.of(new SimpleGrantedAuthority("ROLE_SHOPPER")));
      http.oauth2ResourceServer(oauth -> oauth.jwt(jwt -> jwt.jwtAuthenticationConverter(converter)));
    }

    return http.build();
  }

  @Bean
  CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(allowedOrigins.stream().filter(StringUtils::hasText).toList());
    config.setAllowedMethods(List.of("GET", "PUT", "POST", "PATCH", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of(HttpHeaders.AUTHORIZATION, HttpHeaders.CONTENT_TYPE, "X-Api-Key", "Idempotency-Key", "traceparent", "tracestate"));
    config.setExposedHeaders(List.of("traceparent"));
    config.setAllowCredentials(true);
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
  }

  private static final class ApiKeyAuthenticationFilter extends OncePerRequestFilter {
    private final String expectedApiKey;

    private ApiKeyAuthenticationFilter(String expectedApiKey) {
      this.expectedApiKey = expectedApiKey;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
        throws ServletException, IOException {
      String provided = request.getHeader("X-Api-Key");
      if (hasValidApiKey(provided)) {
        AbstractAuthenticationToken auth = new AbstractAuthenticationToken(List.of(new SimpleGrantedAuthority("ROLE_API_CLIENT"))) {
          @Override
          public Object getCredentials() {
            return "[redacted]";
          }

          @Override
          public Object getPrincipal() {
            return "api-key-client";
          }
        };
        auth.setAuthenticated(true);
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(auth);
      }
      chain.doFilter(request, response);
    }

    private boolean hasValidApiKey(String provided) {
      if (!StringUtils.hasText(expectedApiKey) || !StringUtils.hasText(provided)) {
        return false;
      }
      byte[] expected = expectedApiKey.getBytes(StandardCharsets.UTF_8);
      byte[] actual = provided.getBytes(StandardCharsets.UTF_8);
      return MessageDigest.isEqual(expected, actual);
    }
  }
}
