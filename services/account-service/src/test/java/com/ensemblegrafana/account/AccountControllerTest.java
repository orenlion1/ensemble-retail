package com.ensemblegrafana.account;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

class AccountControllerTest {
  private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

  @Test
  void accountShippingAddressAcceptsAllStorefrontRegions() {
    for (String country : new String[] { "US", "CA", "CN", "UK" }) {
      AccountController.Account account = new AccountController.Account(
          "shopper-" + country.toLowerCase(),
          "Regional Shopper",
          "shopper-" + country.toLowerCase() + "@example.com",
          new AccountController.ShippingAddress("1 Ridge Way", "Denver", "CO", "80202", country),
          new AccountController.Wallet("Visa ending 4242", "80202"));

      assertThat(validator.validate(account)).isEmpty();
    }
  }
}
