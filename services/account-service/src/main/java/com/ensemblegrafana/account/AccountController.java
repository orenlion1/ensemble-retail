package com.ensemblegrafana.account;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;

@RestController
@Validated
@RequestMapping({ "/accounts", "/api/account/accounts" })
public class AccountController {
  private final AccountRepository repository;

  public AccountController(AccountRepository repository) {
    this.repository = repository;
  }

  @GetMapping("/{shopperId}")
  public Account get(@PathVariable @Pattern(regexp = "[A-Za-z0-9._-]{3,80}") String shopperId) {
    return repository.find(shopperId);
  }

  @PutMapping("/{shopperId}")
  public Account put(@PathVariable @Pattern(regexp = "[A-Za-z0-9._-]{3,80}") String shopperId, @Valid @RequestBody Account account) {
    if (looksLikeFullCardNumber(account.wallet().label())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "wallet may only store payment metadata");
    }
    return repository.save(account.withShopperId(shopperId));
  }

  private boolean looksLikeFullCardNumber(String value) {
    String digits = value == null ? "" : value.replaceAll("\\D", "");
    return digits.length() >= 13;
  }

  public record Account(
      @Pattern(regexp = "[A-Za-z0-9._-]{0,80}") String shopperId,
      @NotBlank @Size(max = 120) String name,
      @NotBlank @Email @Size(max = 160) String email,
      @NotNull @Valid ShippingAddress shippingAddress,
      @NotNull @Valid Wallet wallet) {
    Account withShopperId(String shopperId) {
      return new Account(shopperId, name, email, shippingAddress, wallet);
    }

    static Account empty(String shopperId) {
      return new Account(shopperId, "", "", new ShippingAddress("", "", "", "", "US"), new Wallet("", ""));
    }
  }

  public record ShippingAddress(
      @NotBlank @Size(max = 160) String line1,
      @NotBlank @Size(max = 80) String city,
      @NotBlank @Size(max = 40) String region,
      @NotBlank @Size(max = 20) String postalCode,
      @NotBlank @Pattern(regexp = "US|CA|CN|UK|SE") String country) {}

  public record Wallet(
      @NotBlank @Size(max = 80) String label,
      @NotBlank @Size(max = 20) String billingPostalCode) {}
}
