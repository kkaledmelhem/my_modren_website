# Stage 1 — builder
FROM eclipse-temurin:21-jdk-jammy AS builder

RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /build

COPY . .

RUN chmod +x mvnw

RUN ./mvnw -B -DskipTests clean install

RUN cp website/target/website-0.0.1-SNAPSHOT.jar app.jar

# Stage 2 — runtime
FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

COPY --from=builder /build/app.jar app.jar

EXPOSE 8080

ENV PORT=8080

ENTRYPOINT ["java", "-jar", "app.jar", "--server.port=${PORT}"]
