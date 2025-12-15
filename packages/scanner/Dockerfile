FROM python:3.12-slim

WORKDIR /app

# Install uv
RUN pip install uv

COPY pyproject.toml ./
COPY src/ ./src/

RUN uv sync

ENTRYPOINT ["uv", "run", "scan"]
