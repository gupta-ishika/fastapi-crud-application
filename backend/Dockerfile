FROM python:3.10-slim

WORKDIR /app

# Install build dependencies required by some python packages like bcrypt
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# We mount the directory in dev, but copying is good practice
COPY . .

# Run uvicorn on port 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
