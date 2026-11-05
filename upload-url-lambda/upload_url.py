import json
import os
import uuid
import boto3

s3 = boto3.client("s3")

BUCKET_NAME = os.environ["BUCKET_NAME"]

def lambda_handler(event, context):
    try:
        body = json.loads(event.get("body") or "{}")

        filename = body.get("filename", "meeting.webm")
        content_type = body.get("content_type", "audio/webm")

        allowed_types = {
            "audio/webm",
            "audio/wav",
            "audio/mpeg",
            "audio/mp4"
        }

        if content_type not in allowed_types:
            return {
                "statusCode": 400,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps({"error": "Unsupported audio format"})
            }

        extension = filename.rsplit(".", 1)[-1].lower()
        if extension not in {"webm", "wav", "mp3", "mp4"}:
            return {
                "statusCode": 400,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps({"error": "Unsupported file extension"})
            }

        key = f"audio/{uuid.uuid4()}.{extension}"

        upload_url = s3.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": BUCKET_NAME,
                "Key": key,
                "ContentType": content_type
            },
            ExpiresIn=300
        )

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({
                "upload_url": upload_url,
                "key": key
            })
        }

    except Exception as error:
        print("Upload URL generation failed:", str(error))
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"error": "Could not generate upload URL"})
        }
