import os
import json
from pywebpush import webpush, WebPushException
from sqlalchemy.orm import sessionmaker
from celery_utils import celery_app
from main import get_db, PushSubscription  # Import from your main.py

# --- IMPORTANT ---
# You must add these to your .env file and your Railway environment variables
VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY")
VAPID_EMAIL = os.getenv("VAPID_EMAIL", "mailto:your-email@example.com") # A contact email

if not VAPID_PRIVATE_KEY:
    raise ValueError("VAPID_PRIVATE_KEY is not set in environment variables.")

# Setup VAPID claims
vapid_claims = {
    "sub": VAPID_EMAIL
}

@celery_app.task(name="tasks.send_push_notification")
def send_push_notification(subscription_id: int, title: str, body: str):
    """
    Celery task to send a push notification to a single subscription.
    """
    db = None
    try:
        # Get a new database session for this task
        db = next(get_db())
        
        # Get the subscription token from the database
        subscription_db = db.query(PushSubscription).get(subscription_id)
        
        if not subscription_db:
            print(f"Subscription {subscription_id} not found.")
            return

        # Prepare the message payload
        message_data = json.dumps({"title": title, "body": body})
        
        # Send the notification
        webpush(
            subscription_info=subscription_db.subscription_data,
            data=message_data,
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims=vapid_claims
        )
        print(f"Successfully sent notification to subscription {subscription_id}")

    except WebPushException as ex:
        # If the subscription is gone or expired (404, 410), delete it
        if ex.response and ex.response.status_code in [404, 410]:
            print(f"Subscription {subscription_id} is gone. Deleting.")
            if db and subscription_db:
                db.delete(subscription_db)
                db.commit()
        else:
            print(f"Error sending push notification: {ex}")
    
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
    
    finally:
        # Always close the session
        if db:
            db.close()
