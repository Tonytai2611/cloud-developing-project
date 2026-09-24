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

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
    "Access-Control-Allow-Methods": "DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT",
}


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


def _send_contact_email(recipients, subject, text_body, html_body):
    if not recipients:
        print("No verified admin recipients found. Skipping Contact Us email.")
        return False

    source_email = _resolve_source_email(recipients)
    if not source_email:
        print("No verified sender email available. Skipping Contact Us email.")
        return False

    ses.send_email(
        Source=source_email,
        Destination={"ToAddresses": recipients},
        Message={
            "Subject": {"Data": subject, "Charset": "UTF-8"},
            "Body": {
                "Text": {"Data": text_body, "Charset": "UTF-8"},
                "Html": {"Data": html_body, "Charset": "UTF-8"},
            },
        },
    )
    return True


def lambda_handler(event, context):
    try:
        print("Received event:", event)

        http_method = event.get("httpMethod") or event.get("requestContext", {}).get("http", {}).get("method", "POST")
        if http_method == "OPTIONS":
            return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

        if "body" not in event:
            return {
                "statusCode": 400,
                "headers": CORS_HEADERS,
                "body": json.dumps({"error": "Missing 'body' in the event payload"}),
            }

        body = json.loads(event["body"]) if isinstance(event["body"], str) else event["body"]
        name = body.get("name")
        sender_email = body.get("email")
        phone = body.get("phone", "")
        contact_subject = body.get("subject", "General Inquiry")
        message = body.get("message")

        if not name or not sender_email or not message:
            return {
                "statusCode": 400,
                "headers": CORS_HEADERS,
                "body": json.dumps({"error": "Missing required fields: name, email, or message"}),
            }

        recipients = _get_admin_recipients()
        subject = f"New Contact Message: {contact_subject}"
        text_body = "\n".join([
            "NEW CONTACT MESSAGE",
            "",
            f"Sender Name : {name}",
            f"Sender Email: {sender_email}",
            f"Phone       : {phone or 'N/A'}",
            f"Subject     : {contact_subject}",
            "",
            "Message:",
            message,
        ])
        html_body = (
            f"<h2>New Contact Message</h2>"
            f"<p><b>Name:</b> {name}</p>"
            f"<p><b>Email:</b> {sender_email}</p>"
            f"<p><b>Phone:</b> {phone or 'N/A'}</p>"
            f"<p><b>Subject:</b> {contact_subject}</p>"
            f"<hr/><p><b>Message:</b><br/>{message}</p>"
        )

        sent = _send_contact_email(recipients, subject, text_body, html_body)

        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps({
                "message": "Message sent successfully!" if sent else "Message received, but no verified admin recipients were available.",
                "sent": sent,
            }),
        }

    except Exception as error:
        print(f"Error handling contact form: {str(error)}")
        return {
            "statusCode": 500,
            "headers": CORS_HEADERS,
            "body": json.dumps({"error": f"Failed to process request: {str(error)}"}),
        }
