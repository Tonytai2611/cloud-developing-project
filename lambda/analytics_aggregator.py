"""DynamoDB Streams -> daily analytics summary projection.

The projection is deliberately additive/subtractive so MODIFY and REMOVE events
do not double-count revenue or status counters. Event ids are stored in the same
table to make retries idempotent.
"""
import os
from datetime import datetime, timezone
from decimal import Decimal

import boto3
from boto3.dynamodb.types import TypeDeserializer

dynamodb = boto3.resource("dynamodb")
analytics_table = dynamodb.Table(os.environ["ANALYTICS_TABLE"])
deserializer = TypeDeserializer()


def native_image(image):
    return {key: deserializer.deserialize(value) for key, value in (image or {}).items()}


def to_number(value):
    try:
        return Decimal(str(value or 0))
    except Exception:
        return Decimal("0")


def event_date(item):
    raw = item.get("createdAt") or item.get("date")
    if not raw:
        return datetime.now(timezone.utc).date().isoformat()
    return str(raw)[:10]


def is_order(item):
    return to_number(item.get("totalPrice", item.get("total", 0))) > 0 or bool(item.get("selectedItems"))


def delta_for(item, multiplier):
    if not item:
        return None
    status = str(item.get("status", "PENDING")).upper()
    order = is_order(item)
    delta = {
        "totalBookings": Decimal(multiplier),
        "estimatedRevenue": to_number(item.get("totalPrice", item.get("total", 0))) * multiplier,
    }
    if order:
        delta["totalOrders"] = Decimal(multiplier)
        if status in ("PENDING", "PREPARING"):
            delta["pendingOrders"] = Decimal(multiplier)
        if status in ("COMPLETED", "CONFIRMED"):
            delta["completedOrders"] = Decimal(multiplier)
    else:
        if status == "CONFIRMED":
            delta["confirmedBookings"] = Decimal(multiplier)
        if status == "PENDING":
            delta["pendingBookings"] = Decimal(multiplier)
        if status in ("CANCELLED", "REJECTED"):
            delta["cancelledBookings"] = Decimal(multiplier)
        if status == "COMPLETED":
            delta["completedBookings"] = Decimal(multiplier)
    return event_date(item), delta


def apply_delta(date_key, delta):
    if not delta:
        return
    update_parts = []
    names = {}
    values = {":zero": Decimal("0")}
    for index, (field, value) in enumerate(delta.items()):
        name = f"#f{index}"
        value_key = f":v{index}"
        names[name] = field
        values[value_key] = value
        update_parts.append(f"{name} = if_not_exists({name}, :zero) + {value_key}")
    analytics_table.update_item(
        Key={"pk": f"DAILY#{date_key}", "sk": "SUMMARY"},
        UpdateExpression="SET " + ", ".join(update_parts) + ", updatedAt = :updatedAt",
        ExpressionAttributeNames=names,
        ExpressionAttributeValues={**values, ":updatedAt": datetime.now(timezone.utc).isoformat()},
    )


def mark_processed(event_id):
    try:
        analytics_table.put_item(
            Item={"pk": f"EVENT#{event_id}", "sk": "PROCESSED", "processedAt": datetime.now(timezone.utc).isoformat()},
            ConditionExpression="attribute_not_exists(pk)",
        )
        return True
    except analytics_table.meta.client.exceptions.ConditionalCheckFailedException:
        return False


def handle_record(record):
    event_id = record.get("eventID")
    if event_id and not mark_processed(event_id):
        return
    event_name = record.get("eventName")
    dynamodb_record = record.get("dynamodb", {})
    new_item = native_image(dynamodb_record.get("NewImage"))
    old_item = native_image(dynamodb_record.get("OldImage"))
    if event_name == "INSERT":
        change = delta_for(new_item, 1)
        if change:
            apply_delta(*change)
    elif event_name == "REMOVE":
        change = delta_for(old_item, -1)
        if change:
            apply_delta(*change)
    elif event_name == "MODIFY":
        old_change = delta_for(old_item, -1)
        new_change = delta_for(new_item, 1)
        if old_change:
            apply_delta(*old_change)
        if new_change:
            apply_delta(*new_change)


def lambda_handler(event, context):
    for record in event.get("Records", []):
        if record.get("eventSource") == "aws:dynamodb":
            handle_record(record)
    return {"processed": len(event.get("Records", []))}
