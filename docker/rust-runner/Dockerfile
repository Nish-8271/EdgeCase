FROM rust:1.75-slim

WORKDIR /code

RUN useradd -m sandbox
USER sandbox

CMD ["sh", "-c", "rustc -C opt-level=1 -o /tmp/solution /code/solution.rs && /tmp/solution"]