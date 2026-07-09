package com.ensemblegrafana.inventory;

import java.net.URI;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClientBuilder;

@Configuration
public class DynamoConfig {
  @Value("${ensemble.dynamodb.endpoint:}")
  private String endpointOverride;

  @Bean
  DynamoDbClient dynamoDbClient() {
    DynamoDbClientBuilder builder = DynamoDbClient.builder();
    // Only set for local testing against DynamoDB Local; in Lambda the SDK resolves the
    // regional endpoint and IAM role credentials automatically.
    if (StringUtils.hasText(endpointOverride)) {
      builder.endpointOverride(URI.create(endpointOverride));
    }
    return builder.build();
  }
}
