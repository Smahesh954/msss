import boto3
import json

session = boto3.Session(
    profile_name="meeting-agent-dev",
    region_name="ap-south-1"
)

client = session.client("bedrock-runtime")

try:
    response = client.converse(
        modelId="amazon.nova-2-lite-v1:0",
        messages=[
            {
                "role": "user",
                "content": [
                    {"text": "Summarize this sentence in one line: The team discussed project progress and assigned three tasks."}
                ]
            }
        ],
        inferenceConfig={
            "maxTokens": 100,
            "temperature": 0.2
        }
    )

    print("BEDROCK MODEL TEST SUCCESSFUL")
    print(response["output"]["message"]["content"][0]["text"])

except Exception as error:
    print("BEDROCK MODEL TEST FAILED")
    print(type(error).__name__)
    print(error)