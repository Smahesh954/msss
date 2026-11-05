import boto3

session = boto3.Session(
    profile_name="meeting-agent-dev",
    region_name="ap-south-1"
)

bedrock = session.client("bedrock")

response = bedrock.list_foundation_models()

print("Available text-generation models:\n")

for model in response.get("modelSummaries", []):
    if "TEXT" in model.get("outputModalities", []):
        print("Name:", model.get("modelName"))
        print("Model ID:", model.get("modelId"))
        print("Provider:", model.get("providerName"))
        print("-" * 45)