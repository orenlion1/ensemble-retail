package com.ensemblegrafana.account;

import com.ensemblegrafana.account.AccountController.Account;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.GetItemRequest;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;

/**
 * Durable shopper-account store backed by DynamoDB. Replaces the previous in-process map, which did
 * not survive Lambda cold starts or scale across concurrent execution environments. Each account is
 * one item keyed by {@code shopperId}; the profile is stored as a JSON document.
 */
@Repository
public class AccountRepository {
  private final DynamoDbClient dynamo;
  private final ObjectMapper objectMapper;
  private final String tableName;

  public AccountRepository(DynamoDbClient dynamo, ObjectMapper objectMapper,
      @Value("${ensemble.dynamodb.table:ensemble-accounts}") String tableName) {
    this.dynamo = dynamo;
    this.objectMapper = objectMapper;
    this.tableName = tableName;
  }

  public Account find(String shopperId) {
    Map<String, AttributeValue> item = dynamo.getItem(GetItemRequest.builder()
        .tableName(tableName)
        .key(Map.of("shopperId", AttributeValue.fromS(shopperId)))
        .consistentRead(true)
        .build()).item();
    if (item == null || item.isEmpty() || item.get("accountJson") == null) {
      return Account.empty(shopperId);
    }
    try {
      return objectMapper.readValue(item.get("accountJson").s(), Account.class);
    } catch (Exception e) {
      throw new IllegalStateException("Corrupt account document for stored shopper", e);
    }
  }

  public Account save(Account account) {
    try {
      dynamo.putItem(PutItemRequest.builder()
          .tableName(tableName)
          .item(Map.of(
              "shopperId", AttributeValue.fromS(account.shopperId()),
              "accountJson", AttributeValue.fromS(objectMapper.writeValueAsString(account))))
          .build());
      return account;
    } catch (Exception e) {
      throw new IllegalStateException("Could not serialize account", e);
    }
  }
}
