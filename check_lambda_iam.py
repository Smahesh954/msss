import boto3

session = boto3.Session(
    profile_name="meeting-agent-dev",
    region_name="ap-south-1"
)

iam = session.client("iam")

try:
    role = iam.get_role(RoleName="MeetingAgentLambdaRole")
    print("LAMBDA ROLE:")
    print(role["Role"]["Arn"])

    attached = iam.list_attached_role_policies(
        RoleName="MeetingAgentLambdaRole"
    )

    print("\nATTACHED POLICIES:")
    for p in attached["AttachedPolicies"]:
        print(p["PolicyName"])

    inline = iam.list_role_policies(
        RoleName="MeetingAgentLambdaRole"
    )

    print("\nINLINE POLICIES:")
    for p in inline["PolicyNames"]:
        print(p)

except Exception as e:
    print(type(e).__name__, e)
