package com.ensemblegrafana.inventory;

import java.util.List;
import jakarta.validation.constraints.Pattern;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;

@RestController
@Validated
@RequestMapping({ "", "/api/inventory" })
public class InventoryController {
  private final ProductRepository products;

  public InventoryController(ProductRepository products) {
    this.products = products;
  }

  @GetMapping("/products")
  public List<Product> allProducts() {
    return products.findAll();
  }

  @GetMapping("/products/{id}")
  public Product product(@PathVariable @Pattern(regexp = "[a-z0-9-]{3,80}") String id) {
    return products.findAll().stream()
        .filter(product -> product.id().equals(id))
        .findFirst()
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
  }

  @GetMapping("/categories")
  public List<ProductRepository.CategoryGroup> categories() {
    return products.categories();
  }
}
