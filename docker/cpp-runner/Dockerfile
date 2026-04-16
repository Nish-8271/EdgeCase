FROM gcc:13-bookworm

WORKDIR /code

RUN useradd -m sandbox
USER sandbox

CMD ["sh", "-c", "g++ -O1 -o /tmp/solution /code/solution.cpp && /tmp/solution"]