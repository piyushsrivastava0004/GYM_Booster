# Stage 1: Build the JAR with Maven & OpenJDK 21
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder
WORKDIR /build

# Cache dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Compile and package application
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Production Runtime with lightweight JRE
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create unprivileged system user for security
RUN addgroup -S gymgroup && adduser -S gymuser -G gymgroup

# Create persistent storage directories
RUN mkdir -p /app/uploads /app/data && chown -R gymuser:gymgroup /app

COPY --from=builder /build/target/gym-management-system-1.0.0.jar app.jar
RUN chown gymuser:gymgroup app.jar

USER gymuser

ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0 -XX:+UseG1GC -XX:+ExitOnOutOfMemoryError"
EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Djava.security.egd=file:/dev/./urandom -Dspring.profiles.active=prod -jar app.jar"]
