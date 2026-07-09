package com.ensemblegrafana.cart;

import com.amazonaws.serverless.exceptions.ContainerInitializationException;
import com.amazonaws.serverless.proxy.model.AwsProxyRequest;
import com.amazonaws.serverless.proxy.model.AwsProxyResponse;
import com.amazonaws.serverless.proxy.spring.SpringBootLambdaContainerHandler;
import com.amazonaws.serverless.proxy.spring.SpringBootProxyHandlerBuilder;
import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestStreamHandler;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

/**
 * AWS Lambda entry point. Bridges API Gateway HTTP API (payload format 1.0) requests into the
 * existing Spring Boot {@code @RestController}s. SnapStart (configured in Terraform) keeps the
 * Java 21 cold start sub-second.
 */
public class StreamLambdaHandler implements RequestStreamHandler {
  private static final SpringBootLambdaContainerHandler<AwsProxyRequest, AwsProxyResponse> HANDLER;

  static {
    try {
      HANDLER = new SpringBootProxyHandlerBuilder<AwsProxyRequest>()
          .defaultProxy()
          .asyncInit()
          .springBootApplication(CartServiceApplication.class)
          .buildAndInitialize();
    } catch (ContainerInitializationException e) {
      throw new IllegalStateException("Could not initialize Spring Boot application", e);
    }
  }

  @Override
  public void handleRequest(InputStream input, OutputStream output, Context context) throws IOException {
    HANDLER.proxyStream(input, output, context);
  }
}
