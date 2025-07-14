# Project Setup Guide

## 1. Start the MongoDB Database

```bash
docker compose up
```

## Installing Package Manager

```
pip install uv
```

## Create Virtual Environment

```
uv venv
```

## Installing Dependencies

```
uv sync
```

## Enviroment Variables

```
# Create a `.env` file in the root directory with the following content:
MONGO_URI=mongodb://tsx:tsx@localhost:27017?authSource=admin
```

## Running the Application

```
uv run main.py
```
