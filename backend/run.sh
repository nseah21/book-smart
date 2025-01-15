#!/bin/bash

# Navigate to the backend directory (ensure we're in the correct folder)
cd "$(dirname "$0")"

# Detect the OS and activate the virtual environment accordingly
if [[ "$OSTYPE" == "linux-gnu"* || "$OSTYPE" == "darwin"* ]]; then
    echo "Detected Linux/MacOS. Activating virtual environment..."
    source ./venv/bin/activate
elif [[ "$OSTYPE" == "msys"* || "$OSTYPE" == "cygwin"* ]]; then
    echo "Detected Windows. Activating virtual environment..."
    source ./venv/Scripts/activate
else
    echo "Unsupported OS. Exiting."
    exit 1
fi

# Install dependencies
pip install -r requirements.txt

# # Step 1: Seed the database
echo "Seeding the database..."
python -m app.seed

if [ $? -ne 0 ]; then
    echo "Database seeding failed. Exiting."
    exit 1
fi

# Step 2: Run the FastAPI server
echo "Starting the FastAPI server..."
uvicorn app.main:app --reload
