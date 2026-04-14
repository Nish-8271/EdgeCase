FROM eclipse-temurin:21-jdk-alpine

WORKDIR /code

RUN adduser -D sandbox
USER sandbox

CMD ["sh", "-c", "javac -d /tmp /code/Solution.java && java -cp /tmp Solution"]