import boto3

PROFILE = "meeting-agent-dev"
REGION = "ap-south-1"
BUCKET = "ai-meeting-notes-aws-920887851127"
FUNCTION_ARN = "arn:aws:lambda:ap-south-1:920887851127:function:MeetingTranscriptProcessor"

session = boto3.Session(
    profile_name=PROFILE,
    region_name=REGION
)

s3 = session.client("s3")

# Read existing notification settings so they are preserved.
existing = s3.get_bucket_notification_configuration(Bucket=BUCKET)

config = {
    key: value
    for key, value in existing.items()
    if key != "ResponseMetadata"
}

lambda_configs = config.setdefault("LambdaFunctionConfigurations", [])

trigger = {
    "Id": "MeetingTranscriptUploadTrigger",
    "LambdaFunctionArn": FUNCTION_ARN,
    "Events": ["s3:ObjectCreated:*"],
    "Filter": {
        "Key": {
            "FilterRules": [
                {"Name": "prefix", "Value": "transcripts/"},
                {"Name": "suffix", "Value": ".txt"}
            ]
        }
    }
}

# Update this trigger if it already exists; otherwise add it.
lambda_configs = [
    item for item in lambda_configs
    if item.get("Id") != trigger["Id"]
]
lambda_configs.append(trigger)
config["LambdaFunctionConfigurations"] = lambda_configs

s3.put_bucket_notification_configuration(
    Bucket=BUCKET,
    NotificationConfiguration=config
)

print("S3 notification configuration submitted successfully.")

# Read back and verify.
updated = s3.get_bucket_notification_configuration(Bucket=BUCKET)

for item in updated.get("LambdaFunctionConfigurations", []):
    if item.get("Id") == "MeetingTranscriptUploadTrigger":
        print("Verified trigger:", item)