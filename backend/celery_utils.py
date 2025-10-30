import os
from celery import Celery
from dotenv import load_dotenv

load_dotenv()

# Get the Redis URL from Railway's environment variables
# If it's not set (e.g., local testing), it defaults to a standard localhost Redis
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Create the Celery app instance
celery_app = Celery(
    "tasks",
    broker=redis_url,
    backend=redis_url  # Use Redis as the backend to store results too
)

# Set the timezone to UTC (important for scheduling)
celery_app.conf.timezone = 'UTC'

# Tell Celery to look for task definitions in a file named "tasks.py"
celery_app.conf.imports = ("tasks",)

# Optional: Improve Celery's reliability
celery_app.conf.broker_connection_retry_on_startup = True
