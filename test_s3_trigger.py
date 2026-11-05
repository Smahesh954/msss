import boto3
from datetime import datetime, timezone

session = boto3.Session(
    profile_name="meeting-agent-dev",
    region_name="ap-south-1"
)

s3 = session.client("s3")

bucket = "ai-meeting-notes-aws-920887851127"

timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
key = f"transcripts/automatic_trigger_test_{timestamp}.txt"

transcript = """
Project Meeting Test
The team discussed project progress.
The deployment will be tested by the development team.
The next review is scheduled for Friday.
"""

response = s3.put_object(
    Bucket=bucket,
    Key=key,
    Body=transcript.encode("utf-8"),
    ContentType="text/plain"
)

print("Test transcript uploaded successfully.")
print("S3 key:", key)
print("HTTP status:", response["ResponseMetadata"]["HTTPStatusCode"])