package com.ensemblegrafana.inventory;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.ScanRequest;
import software.amazon.awssdk.services.dynamodb.model.ScanResponse;

@Repository
public class ProductRepository {
  private final DynamoDbClient dynamo;
  private final String tableName;

  public ProductRepository(DynamoDbClient dynamo,
      @Value("${ensemble.dynamodb.products-table:ensemble-products}") String tableName) {
    this.dynamo = dynamo;
    this.tableName = tableName;
  }

  @Cacheable("inventory-products")
  public List<Product> findAll() {
    List<Product> products = new ArrayList<>();
    Map<String, AttributeValue> startKey = null;
    do {
      ScanRequest.Builder scan = ScanRequest.builder().tableName(tableName);
      if (startKey != null && !startKey.isEmpty()) {
        scan.exclusiveStartKey(startKey);
      }
      ScanResponse response = dynamo.scan(scan.build());
      response.items().forEach(item -> products.add(toProduct(item)));
      startKey = response.lastEvaluatedKey();
    } while (startKey != null && !startKey.isEmpty());

    products.sort(Comparator.comparing(Product::department)
        .thenComparing(Product::category)
        .thenComparing(Product::name));
    return products;
  }

  @Cacheable("inventory-categories")
  public List<CategoryGroup> categories() {
    // Derived from the cached catalog scan — avoids a second DynamoDB read on every call.
    return findAll().stream()
        .collect(java.util.stream.Collectors.groupingBy(
            Product::department,
            java.util.LinkedHashMap::new,
            java.util.stream.Collectors.mapping(Product::category, java.util.stream.Collectors.toList())))
        .entrySet()
        .stream()
        .map(entry -> new CategoryGroup(entry.getKey(), entry.getValue().stream().distinct().toList()))
        .toList();
  }

  private Product toProduct(Map<String, AttributeValue> item) {
    return new Product(
        str(item, "id"),
        str(item, "name"),
        str(item, "department"),
        str(item, "category"),
        decimal(item, "originalPrice"),
        decimal(item, "price"),
        stringList(item, "colors"),
        stringList(item, "sizes"),
        str(item, "badge"),
        item.containsKey("rating") ? Double.parseDouble(item.get("rating").n()) : 0.0,
        item.containsKey("stock") ? Integer.parseInt(item.get("stock").n()) : 0,
        str(item, "image"));
  }

  private String str(Map<String, AttributeValue> item, String key) {
    AttributeValue value = item.get(key);
    return value == null ? "" : value.s();
  }

  private BigDecimal decimal(Map<String, AttributeValue> item, String key) {
    AttributeValue value = item.get(key);
    return value == null || value.n() == null ? null : new BigDecimal(value.n());
  }

  private List<String> stringList(Map<String, AttributeValue> item, String key) {
    AttributeValue value = item.get(key);
    if (value == null || value.l() == null || value.l().isEmpty()) {
      return List.of();
    }
    return value.l().stream().map(AttributeValue::s).toList();
  }

  public record CategoryGroup(String department, List<String> categories) {}
}
