package com.ensemblegrafana.cart;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
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
@RequestMapping({ "/carts", "/api/cart/carts" })
public class CartController {
  private final Map<String, Cart> carts = new ConcurrentHashMap<>();

  @GetMapping("/{shopperId}")
  public Cart get(@PathVariable @Pattern(regexp = "[A-Za-z0-9._-]{3,80}") String shopperId) {
    return carts.getOrDefault(shopperId, new Cart(shopperId, List.of()));
  }

  @PutMapping("/{shopperId}")
  public Cart put(@PathVariable @Pattern(regexp = "[A-Za-z0-9._-]{3,80}") String shopperId, @Valid @RequestBody Cart cart) {
    if (!shopperId.equals(cart.shopperId())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "shopperId path and body must match");
    }
    Cart saved = new Cart(shopperId, cart.items() == null ? List.of() : cart.items());
    carts.put(shopperId, saved);
    return saved;
  }

  public record Cart(
      @NotBlank @Pattern(regexp = "[A-Za-z0-9._-]{3,80}") String shopperId,
      @Size(max = 50) List<@Valid CartItem> items) {}

  public record CartItem(
      @NotBlank @Size(max = 160) String key,
      @NotBlank @Pattern(regexp = "[a-z0-9-]{3,80}") String productId,
      @NotBlank @Size(max = 120) String name,
      @NotNull @DecimalMin("0.00") BigDecimal price,
      @NotBlank @Size(max = 12) String size,
      @NotBlank @Size(max = 40) String color,
      @NotBlank @Size(max = 500) String image,
      @Min(1) @Max(20) int quantity) {}
}
