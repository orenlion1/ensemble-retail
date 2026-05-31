FROM eclipse-temurin:21-jre
ARG JAR_FILE=target/inventory-service-0.1.0.jar
RUN useradd --system --uid 10001 --create-home appuser
COPY --chown=appuser:appuser ${JAR_FILE} /app/app.jar
USER 10001
WORKDIR /app
EXPOSE 8081
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=60", "-XX:InitialRAMPercentage=30", "-jar", "/app/app.jar"]
