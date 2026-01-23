import json
import boto3
import os

# Initialize SES client
ses = boto3.client('ses', region_name=os.environ.get('AWS_REGION', 'us-east-1'))

# CORS headers
CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT'
}

def lambda_handler(event, context):
    try:
        print("Received event:", event)

        # Handle CORS preflight
        http_method = event.get("httpMethod") or event.get("requestContext", {}).get("http", {}).get("method", "POST")
        if http_method == "OPTIONS":
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

        # Parse the input from the event body
        if 'body' not in event:
            return {
                "statusCode": 400,
                "headers": CORS_HEADERS,
                "body": json.dumps({"error": "Missing 'body' in the event payload"})
            }

        body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        
        name = body.get('name')
        sender_email = body.get('email')
        message = body.get('message')

        # Validate required fields
        if not name or not sender_email or not message:
            return {
                "statusCode": 400,
                "headers": CORS_HEADERS,
                "body": json.dumps({"error": "Missing required fields: name, email, or message"})
            }

        # Configure email details
        source_email = os.environ.get('SOURCE_EMAIL', 'tonytai2611@gmail.com')
        admin_email = os.environ.get('ADMIN_EMAIL', 'tonytai2611@gmail.com')
        
        # Ensure source email is configured
        if not source_email or '@' not in source_email or not admin_email:
             print("⚠️ Email configuration missing. Skipping email send.")
             return {
                "statusCode": 200,
                "headers": CORS_HEADERS,
                "body": json.dumps({"message": "Message received (Email notifications disabled due to missing config)"})
             }

        # Construct Email Subject & Body
        subject = f"📬 New Contact Message from {name}"
        email_body = f"""
╔══════════════════════════════════════════════════════════════╗
║                NEW CONTACT MESSAGE                           ║
╚══════════════════════════════════════════════════════════════╝

👤 Sender Name : {name}
📧 Sender Email: {sender_email}

📝 Message:
──────────────────────────────────────────────────────────────
{message}
──────────────────────────────────────────────────────────────

Date Received: {os.environ.get('date', 'Now')}
"""

        # Send Email via SES
        print(f"Sending email from {source_email} to {admin_email}")
        ses.send_email(
            Source=source_email,
            Destination={'ToAddresses': [admin_email]},
            Message={
                'Subject': {'Data': subject, 'Charset': 'UTF-8'},
                'Body': {
                    'Text': {'Data': email_body, 'Charset': 'UTF-8'},
                     # Simple HTML version
                    'Html': {
                        'Data': f"<h2>New Contact Message</h2><p><b>Name:</b> {name}</p><p><b>Email:</b> {sender_email}</p><hr/><p><b>Message:</b><br/>{message}</p>",
                        'Charset': 'UTF-8'
                    }
                }
            }
        )
        print("✅ Contact notification sent to admin")

        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps({"message": "Message sent successfully!"})
        }

    except Exception as e:
        print(f"❌ Error handling contact form: {str(e)}")
        # Don't return 500 to client if just email failed, but here we assume entire lambda purpose is email
        return {
            "statusCode": 500,
            "headers": CORS_HEADERS,
            "body": json.dumps({"error": f"Failed to process request: {str(e)}"})
        }
