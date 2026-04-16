FROM gcc:13-bookworm

WORKDIR /code

RUN useradd -m sandbox
USER sandbox

CMD ["sh", "-c", "gcc -O1 -std=c11 -o /tmp/solution /code/solution.c && /tmp/solution"]