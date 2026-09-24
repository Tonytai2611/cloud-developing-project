import json
import os

import boto3


AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")
SOURCE_EMAIL = os.environ.get("SOURCE_EMAIL", "")
ADMIN_EMAILS = [email.strip() for email in os.environ.get("ADMIN_EMAILS", "").split(",") if email.strip()]
ADMIN_GROUP_NAME = os.environ.get("ADMIN_GROUP_NAME", "admin")
COGNITO_USER_POOL_ID = os.environ.get("COGNITO_USER_POOL_ID", "")
SES_REQUIRE_VERIFIED_RECIPIENTS = os.environ.get("SES_REQUIRE_VERIFIED_RECIPIENTS", "true").lower() == "true"

ses = boto3.client("ses", region_name=AWS_REGION)
cognito = boto3.client("cognito-idp", region_name=AWS_REGION)


def _identity_is_verified(email):
    if not email:
        return False

    response = ses.get_identity_verification_attributes(Identities=[email])
    status = response.get("VerificationAttributes", {}).get(email, {}).get("VerificationStatus")
    return status == "Success"


def _filter_verified_emails(emails):
    unique_emails = list(dict.fromkeys(email for email in emails if email and "@" in email))
    if not SES_REQUIRE_VERIFIED_RECIPIENTS:
        return unique_emails

    verified = []
    for email in unique_emails:
        if _identity_is_verified(email):
            verified.append(email)
        else:
            print(f"Skipping unverified SES recipient: {email}")
    return verified


def _get_admin_emails_from_cognito():
    if not COGNITO_USER_POOL_ID:
        return []

    admins = []
    pagination_token = None
    while True:
        params = {
            "UserPoolId": COGNITO_USER_POOL_ID,
            "GroupName": ADMIN_GROUP_NAME,
            "Limit": 60,
        }
        if pagination_token:
            params["NextToken"] = pagination_token

        response = cognito.list_users_in_group(**params)
        for user in response.get("Users", []):
            attributes = {item["Name"]: item.get("Value", "") for item in user.get("Attributes", [])}
            email = attributes.get("email")
            if email:
                admins.append(email)

        pagination_token = response.get("NextToken")
        if not pagination_token:
            break

    return admins


def _get_admin_recipients():
    return _filter_verified_emails(_get_admin_emails_from_cognito() + ADMIN_EMAILS)


def _resolve_source_email(preferred_recipients):
    if SOURCE_EMAIL and "@" in SOURCE_EMAIL:
        if not SES_REQUIRE_VERIFIED_RECIPIENTS or _identity_is_verified(SOURCE_EMAIL):
            return SOURCE_EMAIL
        print(f"SOURCE_EMAIL is not verified in SES: {SOURCE_EMAIL}")
        return ""

    for email in preferred_recipients:
        if not SES_REQUIRE_VERIFIED_RECIPIENTS or _identity_is_verified(email):
            return email

    return ""


def _send_email(to_emails, subject, text):
    recipients = _filter_verified_emails(to_emails if isinstance(to_emails, list) else [to_emails])

    if not recipients:
        print(f"No verified recipients available. Skipping email: {subject}")
        return False

    source_email = _resolve_source_email(_get_admin_recipients())
    if not source_email:
        print(f"No verified sender email available. Skipping email: {subject}")
        return False

    response = ses.send_email(
        Source=source_email,
        Destination={"ToAddresses": recipients},
        Message={
            "Subject": {"Data": subject, "Charset": "UTF-8"},
            "Body": {
                "Text": {"Data": text, "Charset": "UTF-8"},
                "Html": {"Data": f"<pre style='font-family: monospace'>{text}</pre>", "Charset": "UTF-8"},
            },
        },
    )
    print(f"Email sent to {recipients}: {response['MessageId']}")
    return True


def _load_booking_event(record):
    body = json.loads(record.get("body", "{}"))

    if "Message" in body:
        message = body["Message"]
        return json.loads(message) if isinstance(message, str) else message

    return body


def _booking_summary(event):
    items = event.get("selectedItems") or []
    item_lines = []
    for item in items:
        name = item.get("name") or item.get("title") or "Menu item"
        quantity = item.get("quantity", 1)
        item_lines.append(f"- {name} x{quantity}")

    return "\n".join([
        f"Booking ID : {event.get('bookingId') or event.get('id') or 'N/A'}",
        f"Status     : {event.get('status', 'PENDING')}",
        f"Source     : {event.get('bookingSource', 'GUEST')}",
        f"Name       : {event.get('customerName', 'Customer')}",
        f"Email      : {event.get('email', 'N/A')}",
        f"Phone      : {event.get('phone', 'N/A')}",
        f"Date       : {event.get('date', 'N/A')}",
        f"Time       : {event.get('time', 'N/A')}",
        f"Table      : {event.get('tableNumber') or event.get('tableId') or 'N/A'}",
        f"Guests     : {event.get('guests', 'N/A')}",
        f"Total      : {event.get('total', 0)}",
        "Items      :",
        "\n".join(item_lines) if item_lines else "- No menu items selected",
        f"Requests   : {event.get('specialRequests') or 'None'}",
    ])


def _handle_booking_created(event):
    admin_text = "\n".join([
        "A new booking request is waiting for admin review.",
        "",
        _booking_summary(event),
    ])
    _send_email(_get_admin_recipients(), "New BrewCraft Booking Request", admin_text)

    customer_email = event.get("email")
    customer_name = event.get("customerName", "Customer")
    if customer_email:
        customer_text = "\n".join([
            f"Hi {customer_name},",
            "",
            "We received your BrewCraft booking request.",
            "Your reservation is currently pending admin confirmation.",
            "",
            _booking_summary(event),
            "",
            "We will email you again once the booking is confirmed or rejected.",
        ])
        _send_email(customer_email, "BrewCraft Booking Request Received", customer_text)


def _handle_booking_decision(event):
    status = event.get("status", "UPDATED")
    customer_email = event.get("email")
    customer_name = event.get("customerName", "Customer")

    if status == "CONFIRMED":
        subject = "BrewCraft Booking Confirmed"
        intro = "Great news. Your BrewCraft booking has been confirmed."
    elif status == "REJECTED":
        subject = "BrewCraft Booking Update"
        intro = "We are sorry, but your BrewCraft booking could not be confirmed."
    elif status == "CANCELLED":
        subject = "BrewCraft Booking Cancelled"
        intro = "Your BrewCraft booking has been cancelled."
    else:
        subject = "BrewCraft Booking Updated"
        intro = "Your BrewCraft booking has been updated."

    text = "\n".join([
        f"Hi {customer_name},",
        "",
        intro,
        "",
        _booking_summary(event),
        "",
        "Thank you,",
        "The BrewCraft Team",
    ])
    _send_email(customer_email, subject, text)


def lambda_handler(event, context):
    print("Received event:", json.dumps(event))

    for record in event.get("Records", []):
        booking_event = _load_booking_event(record)
        event_type = booking_event.get("type", "")
        print(f"Processing booking event: {event_type}")

        if event_type == "BOOKING_CREATED":
            _handle_booking_created(booking_event)
        elif event_type in ("BOOKING_DECISION", "BOOKING_UPDATED"):
            _handle_booking_decision(booking_event)
        else:
            print(f"Unknown booking event type: {event_type}")

    return {"statusCode": 200, "body": json.dumps({"message": "Processed booking notifications"})}
