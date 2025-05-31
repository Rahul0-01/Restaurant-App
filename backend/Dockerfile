# Use an official OpenJDK runtime as a parent image
FROM openjdk:17-jdk-slim

# Set the working directory in the container
WORKDIR /app

# Copy the Maven wrapper and pom.xml to leverage Docker cache
# If you are using Gradle, you will need to adjust these lines later. For now, let's assume Maven.
COPY .mvn/ .mvn
COPY mvnw pom.xml ./

# Make mvnw executable
RUN chmod +x mvnw

# Build the application (This will also download dependencies)
RUN ./mvnw clean package -DskipTests

# Expose the port the app runs on (Spring Boot default is 8080)
EXPOSE 8080

# Define the command to run the application
# IMPORTANT: We will customize the 'your-app-name-0.0.1-SNAPSHOT.jar' part in the NEXT step.
ENTRYPOINT ["java", "-jar", "target/restaurantapp-0.0.1-SNAPSHOT.jar"]