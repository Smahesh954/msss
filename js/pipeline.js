/**
 * AI Meeting Notes Agent - AWS Pipeline Simulator
 * Visualizes the async event-driven architecture and stages:
 * S3 -> EventBridge -> Lambda -> Transcribe -> Bedrock -> OpenSearch -> DynamoDB -> SNS/SES
 */

document.addEventListener("DOMContentLoaded", () => {
  setupPipelineSimulation();
});

function setupPipelineSimulation() {
  const simBtn = document.getElementById("trigger-pipeline-btn");
  if (simBtn) {
    simBtn.addEventListener("click", runPipelineSimulation);
  }

  const dlqBtn = document.getElementById("trigger-dlq-btn");
  if (dlqBtn) {
    dlqBtn.addEventListener("click", runDLQSimulation);
  }
}

async function runPipelineSimulation() {
  const simBtn = document.getElementById("trigger-pipeline-btn");
  if (simBtn) simBtn.disabled = true;

  resetPipelineNodes();
  logPipelineEvent("🚀 Initiating asynchronous event pipeline simulation...");

  const stages = [
    { id: "node-s3", name: "Amazon S3", log: "Audio file meeting_rec_20261014.wav (48MB) uploaded to s3://meeting-notes-raw-audio/" },
    { id: "node-eventbridge", name: "Amazon EventBridge", log: "Event rule matched: source: aws.s3, detail-type: Object Created -> Routed to Lambda target" },
    { id: "node-lambda", name: "AWS Lambda", log: "Lambda orchestrator invoked asynchronously; generated job execution token" },
    { id: "node-transcribe", name: "Amazon Transcribe", log: "Streaming Speech-to-Text completed with Speaker Diarization (Identified: Alice, Bob, Charlie)" },
    { id: "node-bedrock", name: "Amazon Bedrock", log: "Bedrock Claude 3.5 generated structured JSON: Executive Summary & 3 Action Items" },
    { id: "node-opensearch", name: "OpenSearch Serverless", log: "Speaker-attributed timestamped chunks vectorized & indexed into Bedrock Knowledge Base" },
    { id: "node-dynamodb", name: "Amazon DynamoDB", log: "Stored meeting metadata, attendees, and action item status records" },
    { id: "node-sns", name: "Amazon SNS / SES", log: "Meeting summary email dispatched to 4 attendees within 38 seconds total latency!" }
  ];

  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i];
    const elem = document.getElementById(stage.id);
    if (elem) {
      elem.classList.add("active");
    }

    logPipelineEvent(`[Step ${i + 1}/8] ${stage.name}: ${stage.log}`);
    await sleep(750);

    if (elem) {
      elem.classList.remove("active");
      elem.classList.add("success");
    }
  }

  logPipelineEvent("✅ Async Event Pipeline Completed Successfully! All records indexed.");
  if (simBtn) simBtn.disabled = false;
}

async function runDLQSimulation() {
  resetPipelineNodes();
  logPipelineEvent("⚠️ Testing Dead-Letter Queue (DLQ) Failure Handling Scenario...");

  const s3Elem = document.getElementById("node-s3");
  const ebElem = document.getElementById("node-eventbridge");
  const lambdaElem = document.getElementById("node-lambda");
  const transcribeElem = document.getElementById("node-transcribe");

  if (s3Elem) s3Elem.classList.add("success");
  logPipelineEvent("Audio file uploaded to S3 bucket.");
  await sleep(600);

  if (ebElem) ebElem.classList.add("success");
  logPipelineEvent("EventBridge rule routed to Lambda.");
  await sleep(600);

  if (lambdaElem) lambdaElem.classList.add("success");
  logPipelineEvent("Lambda triggered Amazon Transcribe streaming...");
  await sleep(700);

  if (transcribeElem) {
    transcribeElem.classList.add("dlq");
  }
  logPipelineEvent("❌ SIMULATED FAILURE: Transcribe audio stream corrupted or invalid codec format!");
  await sleep(600);

  logPipelineEvent("🛡️ Event routed to SQS Dead-Letter Queue (meeting-notes-transcribe-dlq)!");
  logPipelineEvent("📢 CloudWatch Alarm fired: DLQDepth > 0 -> PagerDuty & Slack alert dispatched to DevOps on-call.");
}

function resetPipelineNodes() {
  const nodes = document.querySelectorAll(".pipeline-node");
  nodes.forEach(n => {
    n.classList.remove("active", "success", "dlq");
  });
}

function logPipelineEvent(msg) {
  const terminal = document.getElementById("pipeline-terminal");
  if (!terminal) return;

  const line = document.createElement("div");
  const now = new Date().toLocaleTimeString();
  line.style.marginBottom = "4px";
  line.innerHTML = `<span style="color:#64748b;">[${now}]</span> ${escapeHtml(msg)}`;
  terminal.appendChild(line);
  terminal.scrollTop = terminal.scrollHeight;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
