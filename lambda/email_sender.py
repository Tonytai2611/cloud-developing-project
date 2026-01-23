import boto3
import json
import os

ses = boto3.client('ses', region_name=os.environ.get('AWS_REGION', 'us-east-1'))

def lambda_handler(event, context):
    
    try:
        for record in event['Records']:
            # SNS sends MessageStructure with 'default' for Lambda
            sns_raw_message = record['Sns']['Message']
            
            # Try to parse as MessageStructure first
            try:
                message_structure = json.loads(sns_raw_message)
                if 'default' in message_structure:
                    sns_message = json.loads(message_structure['default'])
                else:
                    sns_message = message_structure
            except:
                sns_message = json.loads(sns_raw_message)
            
            email = sns_message.get('email')
            customer_name = sns_message.get('customerName', 'Customer')
            booking_id = sns_message.get('bookingId')
            status = sns_message.get('status')
            date = sns_message.get('date')
            time = sns_message.get('time')
            table_number = sns_message.get('tableNumber', 'N/A')
            guests = sns_message.get('guests', 0)
            
            print(f"📧 Email notification: {booking_id} ({status}) → {email}")
            
            if status == 'CONFIRMED':
                subject = "✅ Booking Confirmed - Brewcraft Restaurant"
                message = f"""
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║           🎉  BOOKING CONFIRMATION  🎉                      ║
║                                                              ║
║              BREWCRAFT RESTAURANT                            ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

Dear {customer_name},

Great news! Your table reservation has been CONFIRMED.

┌──────────────────────────────────────────────────────────────┐
│  RESERVATION DETAILS                                         │
└──────────────────────────────────────────────────────────────┘

  📋  Booking ID      : {booking_id}
  📅  Date            : {date}
  🕐  Time            : {time}
  🪑  Table           : {table_number}
  👥  Party Size      : {guests} {'person' if guests == 1 else 'people'}

┌──────────────────────────────────────────────────────────────┐
│  IMPORTANT INFORMATION                                       │
└──────────────────────────────────────────────────────────────┘

  ✓  Please arrive 10 minutes before your reservation time
  ✓  Your table will be held for 15 minutes
  ✓  For any changes, please contact us in advance

┌──────────────────────────────────────────────────────────────┐
│  CONTACT US                                                  │
└──────────────────────────────────────────────────────────────┘

  📞  Phone    : +84 123 456 789
  📧  Email    : tonytai2611@gmail.com
  🌐  Website  : www.brewcraft.com
  📍  Address  : 123 Restaurant Street, Ho Chi Minh City

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

We look forward to serving you! 🍽️

Best regards,
The Brewcraft Team

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                """
                
            else:  # REJECTED
                subject = "❌ Booking Update - Brewcraft Restaurant"
                message = f"""
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║           📋  BOOKING UPDATE  📋                            ║
║                                                              ║
║              BREWCRAFT RESTAURANT                            ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

Dear {customer_name},

We apologize, but we are unable to confirm your reservation.

┌──────────────────────────────────────────────────────────────┐
│  REQUESTED BOOKING                                           │
└──────────────────────────────────────────────────────────────┘

  📋  Booking ID      : {booking_id}
  📅  Date            : {date}
  🕐  Time            : {time}
  👥  Party Size      : {guests} {'person' if guests == 1 else 'people'}

┌──────────────────────────────────────────────────────────────┐
│  REASON                                                      │
└──────────────────────────────────────────────────────────────┘

  Unfortunately, we are fully booked for this time slot.

┌──────────────────────────────────────────────────────────────┐
│  ALTERNATIVE OPTIONS                                         │
└──────────────────────────────────────────────────────────────┘

  ✓  Try a different time slot
  ✓  Choose an alternative date
  ✓  Contact us for special arrangements

┌──────────────────────────────────────────────────────────────┐
│  CONTACT US                                                  │
└──────────────────────────────────────────────────────────────┘

  📞  Phone    : +84 123 456 789
  📧  Email    : tonytai2611@gmail.com
  🌐  Website  : www.brewcraft.com

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

We apologize for the inconvenience and hope to serve you soon.

Best regards,
The Brewcraft Team

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                """
            
            # Send via SES
            try:
                source_email = os.environ.get('SOURCE_EMAIL', 'tonytai2611@gmail.com')
                
                # Check if we have a valid source email
                if not source_email or '@' not in source_email:
                    print("⚠️ SOURCE_EMAIL environment variable not set. Email sending skipped.")
                    print(f"Would have sent to {email}: {subject}")
                    continue

                response = ses.send_email(
                    Source=source_email,
                    Destination={
                        'ToAddresses': [email]
                    },
                    Message={
                        'Subject': {
                            'Data': subject,
                            'Charset': 'UTF-8'
                        },
                        'Body': {
                            'Text': {
                                'Data': message,
                                'Charset': 'UTF-8'
                            },
                            'Html': {
                                'Data': f"<pre style='font-family: monospace;'>{message}</pre>",
                                'Charset': 'UTF-8'
                            }
                        }
                    }
                )
                print(f"✅ Email sent to {email}: {response['MessageId']}")
            except Exception as ses_error:
                print(f"❌ Failed to send SES email to {email}: {str(ses_error)}")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Email processing complete'
            })
        }
        
    except Exception as e:
        print(f"❌ Error in EmailSender Lambda: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
