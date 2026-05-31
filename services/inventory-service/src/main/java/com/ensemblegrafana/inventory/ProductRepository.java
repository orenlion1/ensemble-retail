package com.ensemblegrafana.inventory;

import java.util.Arrays;
import java.util.List;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class ProductRepository {
  private final JdbcClient jdbc;

  public ProductRepository(JdbcClient jdbc) {
    this.jdbc = jdbc;
  }

  @Cacheable("inventory-products")
  public List<Product> findAll() {
    return jdbc.sql("SELECT * FROM products ORDER BY department, category, name")
        .query((rs, rowNum) -> new Product(
            rs.getString("id"),
            rs.getString("name"),
            rs.getString("department"),
            rs.getString("category"),
            rs.getBigDecimal("original_price"),
            rs.getBigDecimal("price"),
            split(rs.getString("colors")),
            split(rs.getString("sizes")),
            rs.getString("badge"),
            rs.getDouble("rating"),
            rs.getInt("stock"),
            rs.getString("image")))
        .list();
  }

  @Cacheable("inventory-categories")
  public List<CategoryGroup> categories() {
    return jdbc.sql("SELECT department, category FROM products GROUP BY department, category ORDER BY department, category")
        .query((rs, rowNum) -> new CategoryRow(rs.getString("department"), rs.getString("category")))
        .list()
        .stream()
        .collect(java.util.stream.Collectors.groupingBy(CategoryRow::department, java.util.LinkedHashMap::new, java.util.stream.Collectors.mapping(CategoryRow::category, java.util.stream.Collectors.toList())))
        .entrySet()
        .stream()
        .map(entry -> new CategoryGroup(entry.getKey(), entry.getValue()))
        .toList();
  }

  public record CategoryGroup(String department, List<String> categories) {}

  private record CategoryRow(String department, String category) {}

  private List<String> split(String value) {
    return Arrays.stream(value.split(",")).map(String::trim).toList();
  }
}
