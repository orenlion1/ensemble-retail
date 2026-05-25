FROM eclipse-temurin:21-jre
ARG JAR_FILE=target/account-service-0.1.0.jar
RUN useradd --system --uid 10001 --create-home appuser
COPY --chown=appuser:appuser ${JAR_FILE} /app/app.jar
USER 10001
WORKDIR /app
EXPOSE 8083
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "/app/app.jar"]
