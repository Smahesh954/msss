import boto3
import os
import json
from urllib.parse import unquote_plus

s3 = boto3.client("s3")

def lambda_handler(event, context):
    bucket = os.environ["BUCKET_NAME"]

    for record in event.get("Records", []):
        key = unquote_plus(record["s3"]["object"]["key"])

        if not key.startswith("transcripts/"):
            continue

        response = s3.get_object(Bucket=bucket, Key=key)
        transcript = response["Body"].read().decode("utf-8")

        print("Meeting transcript received")
        print("S3 key:", key)
        print("Transcript length:", len(transcript))
        print("Transcript:", transcript)

    return {
        "statusCode": 200,
        "body": json.dumps("Transcript processed successfully")
    }
