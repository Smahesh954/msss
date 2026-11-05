import boto3

session = boto3.Session(
    profile_name="meeting-agent-dev",
    region_name="ap-south-1"
)

sts = session.client("sts")
iam = session.client("iam")

try:
    identity = sts.get_caller_identity()
    print("AWS ACCOUNT:", identity["Account"])
    print("AWS ARN:", identity["Arn"])

    print("\nCHECKING BEDROCK PERMISSIONS:")

    bedrock = session.client("bedrock")
    response = bedrock.get_foundation_model_availability(
        modelId="amazon.nova-2-lite-v1:0"
    )

    print("MODEL AVAILABILITY:")
    print(response)

except Exception as e:
    print("ERROR:", type(e).__name__, e)
