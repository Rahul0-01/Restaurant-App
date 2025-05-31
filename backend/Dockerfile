FROM openjdk:17-jdk-slim AS build
WORKDIR /app

COPY pom.xml mvnw ./
COPY .mvn/ .mvn
RUN chmod +x mvnw

COPY src/ src/

RUN ./mvnw clean package -DskipTests
RUN jar tf target/restaurantapp-0.0.1-SNAPSHOT.jar | grep "RestaurantappApplication"

FROM eclipse-temurin:17-jdk-jammy
WORKDIR /app
COPY --from=build /app/target/restaurantapp-0.0.1-SNAPSHOT.jar ./app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
