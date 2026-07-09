package com.ensemblegrafana.cart;

import com.ensemblegrafana.cart.CartController.Cart;
import com.ensemblegrafana.cart.CartController.CartItem;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.GetItemRequest;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;

/**
 * Durable shopper-cart store backed by DynamoDB. Replaces the previous in-process map, which did
 * not survive Lambda cold starts or scale across concurrent execution environments. Each cart is
 * one item keyed by {@code shopperId}; the line items are stored as a JSON document.
 */
@Repository
public class CartRepository {
  private final DynamoDbClient dynamo;
  private final ObjectMapper objectMapper;
  private final String tableName;

  public CartRepository(DynamoDbClient dynamo, ObjectMapper objectMapper,
      @Value("${ensemble.dynamodb.table:ensemble-carts}") String tableName) {
    this.dynamo = dynamo;
    this.objectMapper = objectMapper;
    this.tableName = tableName;
  }

  public Cart find(String shopperId) {
    Map<String, AttributeValue> item = dynamo.getItem(GetItemRequest.builder()
        .tableName(tableName)
        .key(Map.of("shopperId", AttributeValue.fromS(shopperId)))
        .consistentRead(true)
        .build()).item();
    if (item == null || item.isEmpty()) {
      return new Cart(shopperId, List.of());
    }
    return new Cart(shopperId, readItems(item.get("itemsJson")));
  }

  public Cart save(Cart cart) {
    dynamo.putItem(PutItemRequest.builder()
        .tableName(tableName)
        .item(Map.of(
            "shopperId", AttributeValue.fromS(cart.shopperId()),
            "itemsJson", AttributeValue.fromS(writeItems(cart.items()))))
        .build());
    return cart;
  }

  private List<CartItem> readItems(AttributeValue value) {
    if (value == null || value.s() == null || value.s().isBlank()) {
      return List.of();
    }
    try {
      return objectMapper.readValue(value.s(), new TypeReference<List<CartItem>>() {});
    } catch (Exception e) {
      throw new IllegalStateException("Corrupt cart document for stored shopper", e);
    }
  }

  private String writeItems(List<CartItem> items) {
    try {
      return objectMapper.writeValueAsString(items == null ? List.of() : items);
    } catch (Exception e) {
      throw new IllegalStateException("Could not serialize cart items", e);
    }
  }
}
