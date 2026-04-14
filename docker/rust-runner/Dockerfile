FROM rust:1.75-slim

WORKDIR /code

RUN useradd -m sandbox
USER sandbox

CMD ["sh", "-c", "rustc -O -o /tmp/solution /code/solution.rs && /tmp/solution"]