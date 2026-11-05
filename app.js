/**
 * ==============================================================================
 * Project 8: AI Meeting Notes Agent (Background Recorder)
 * Master Client Application (JavaScript)
 * File: app.js
 *
 * Implements:
 * 1. Web Audio API Microphone Recording & Waveform Visualizer
 * 2. Streaming Real-Time Speaker Diarization Feed
 * 3. Structured Action-Item & Decision Extraction with Live JSON Schema
 * 4. RAG Q&A Assistant with Speaker & Timestamp Citations
 * 5. AWS Asynchronous Event-Driven Pipeline Simulator & DLQ Error Injection
 * 6. Multi-Tab Navigation & Client-Side Fallback for Standalone In-Browser Run
 * ==============================================================================
 */

// Global Application State
const state = {
  isRecording: false,
  streamInterval: null,
  meetingTimerInterval: null,
  elapsedSeconds: 0,
  isBackendConnected: false,
  activeSpeaker: null,
  currentTurns: [],
  turnIndex: 0,
  audioContext: null,
  analyser: null,
  micStream: null,
  dataArray: null
};

// Preset Meeting Turns (Project 8 Architecture Walkthrough)
const sampleTurns = [
  {
    speaker: "Alice (Cloud Architect)",
    speakerTag: "speaker-1",
    timestamp: "00:01",
    text: "Welcome team! Today we are reviewing the architecture for Project 8: AI Meeting Notes Agent as a background recorder.",
    confidence: 0.98
  },
  {
    speaker: "Bob (ML Engineer)",
    speakerTag: "speaker-2",
    timestamp: "00:04",
    text: "For the audio ingest, Amazon Transcribe streaming with speaker diarization will identify distinct speakers and emit timestamped segments.",
    confidence: 0.97
  },
  {
    speaker: "Alice (Cloud Architect)",
    speakerTag: "speaker-1",
    timestamp: "00:08",
    text: "Remember, we must use an asynchronous event-driven architecture with Amazon S3 and EventBridge, not synchronous request-response.",
    confidence: 0.99
  },
  {
    speaker: "Bob (ML Engineer)",
    speakerTag: "speaker-2",
    timestamp: "00:12",
    text: "For RAG, we must chunk transcripts preserving speaker attribution and start/end timestamps, then index into OpenSearch Serverless via Bedrock Knowledge Base.",
    confidence: 0.96
  },
  {
    speaker: "Charlie (DevOps Lead)",
    speakerTag: "speaker-3",
    timestamp: "00:17",
    text: "For CI/CD, we need sample audio fixtures in regression tests, DLQ for failed transcription jobs, and a shadow pipeline before final cutover.",
    confidence: 0.98
  },
  {
    speaker: "Alice (Cloud Architect)",
    speakerTag: "speaker-1",
    timestamp: "00:22",
    text: "Bedrock Claude 3.5 will extract action items into structured JSON, save to DynamoDB, and trigger SNS/SES email summaries to attendees.",
    confidence: 0.97
  }
];

// Initial Structured Action Items
let actionItems = [
  {
    id: "act-1",
    task: "Configure S3 -> EventBridge -> Lambda asynchronous notification rule",
    owner: "Alice (Cloud Architect)",
    priority: "HIGH",
    completed: true
  },
  {
    id: "act-2",
    task: "Implement speaker diarization parser & preserve timestamp chunking for RAG",
    owner: "Bob (ML Engineer)",
    priority: "HIGH",
    completed: false
  },
  {
    id: "act-3",
    task: "Setup Dead-Letter Queue (DLQ) alerts & CI/CD sample audio test fixtures",
    owner: "Charlie (DevOps Lead)",
    priority: "MEDIUM",
    completed: false
  }
];

// Document Initialization
document.addEventListener("DOMContentLoaded", () => {
  initVisualizer();
  setupTabs();
  setupRecorder();
  setupActionItems();
  setupRAG();
  setupPipelineSimulation();
  checkBackendHealth();
  updateStructuredJsonView();
});

// ==============================================================================
// 1. Tab Navigation Controller
// ==============================================================================
function setupTabs() {
  const tabBtns = document.querySelectorAll(".nav-tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-tab");

      tabBtns.forEach(b => b.classList.remove("active"));
      tabContents.forEach(c => c.classList.remove("active"));

      btn.classList.add("active");
      const targetContent = document.getElementById(targetId);
      if (targetContent) targetContent.classList.add("active");
    });
  });
}

// ==============================================================================
// 2. Audio Visualizer & Background Recording
// ==============================================================================
function initVisualizer() {
  const container = document.getElementById("visualizer");
  if (!container) return;
  container.innerHTML = "";
  for (let i = 0; i < 36; i++) {
    const bar = document.createElement("div");
    bar.className = "vis-bar";
    container.appendChild(bar);
  }
}

function setupRecorder() {
  const toggleBtn = document.getElementById("record-toggle-btn");
  const resetBtn = document.getElementById("reset-stream-btn");
  const meetingSelect = document.getElementById("sample-meeting-select");

  if (toggleBtn) {
    toggleBtn.addEventListener("click", toggleRecording);
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", resetStream);
  }

  if (meetingSelect) {
    meetingSelect.addEventListener("change", (e) => {
      resetStream();
      if (e.target.value === "open-claw") {
        logPipelineEvent("Switched session context: Project 9 OpenClaw Coding Sync");
      } else {
        logPipelineEvent("Switched session context: Sprint Architecture Review");
      }
    });
  }
}

async function toggleRecording() {
  const toggleBtn = document.getElementById("record-toggle-btn");
  const statusLabel = document.getElementById("recorder-state-label");
  const visualizer = document.getElementById("visualizer");

  if (!state.isRecording) {
    // Start Recording
    state.isRecording = true;
    toggleBtn.classList.add("recording");
    toggleBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
      Stop Background Recording
    `;
    if (statusLabel) statusLabel.textContent = "Streaming audio to Amazon Transcribe (16kHz Opus)...";
    if (visualizer) visualizer.classList.add("recording");

    startTimer();
    startDiarizationStream();
    initWebAudioMic();
  } else {
    // Stop Recording
    state.isRecording = false;
    toggleBtn.classList.remove("recording");
    toggleBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="7"/></svg>
      Start Background Recording
    `;
    if (statusLabel) statusLabel.textContent = "Recording paused. Stream chunked and indexed.";
    if (visualizer) visualizer.classList.remove("recording");

    stopTimer();
    stopDiarizationStream();
    stopWebAudioMic();
  }
}

function startTimer() {
  stopTimer();
  state.meetingTimerInterval = setInterval(() => {
    state.elapsedSeconds++;
    const mins = String(Math.floor(state.elapsedSeconds / 60)).padStart(2, "0");
    const secs = String(state.elapsedSeconds % 60).padStart(2, "0");
    const timerElem = document.getElementById("meeting-timer");
    if (timerElem) timerElem.textContent = `${mins}:${secs}`;
  }, 1000);
}

function stopTimer() {
  if (state.meetingTimerInterval) {
    clearInterval(state.meetingTimerInterval);
    state.meetingTimerInterval = null;
  }
}

function resetStream() {
  if (state.isRecording) toggleRecording();
  state.elapsedSeconds = 0;
  state.turnIndex = 0;
  state.currentTurns = [];
  const timerElem = document.getElementById("meeting-timer");
  if (timerElem) timerElem.textContent = "00:00";

  const streamContainer = document.getElementById("transcript-stream");
  if (streamContainer) streamContainer.innerHTML = "";

  const chunkCount = document.getElementById("chunk-count");
  if (chunkCount) chunkCount.textContent = "0 Turns Ingested";

  logPipelineEvent("Stream reset. Ready for next ingestion.");
}

async function initWebAudioMic() {
  try {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      state.micStream = stream;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      state.audioContext = new AudioCtx();
      state.analyser = state.audioContext.createAnalyser();
      state.analyser.fftSize = 64;

      const source = state.audioContext.createMediaStreamSource(stream);
      source.connect(state.analyser);

      const bufferLength = state.analyser.frequencyBinCount;
      state.dataArray = new Uint8Array(bufferLength);
      animateMicrophoneBars();
    }
  } catch (err) {
    // Microphone not accessible or permission denied; CSS animation continues
    console.log("Microphone access simulated:", err.message);
  }
}

function stopWebAudioMic() {
  if (state.micStream) {
    state.micStream.getTracks().forEach(track => track.stop());
    state.micStream = null;
  }
  if (state.audioContext && state.audioContext.state !== "closed") {
    state.audioContext.close();
  }
}

function animateMicrophoneBars() {
  if (!state.isRecording || !state.analyser) return;

  state.analyser.getByteFrequencyData(state.dataArray);
  const bars = document.querySelectorAll(".vis-bar");
  if (bars.length > 0) {
    for (let i = 0; i < bars.length; i++) {
      const val = state.dataArray[i % state.dataArray.length] || 0;
      const height = Math.max(6, Math.min(52, (val / 255) * 52));
      bars[i].style.height = `${height}px`;
    }
  }
  requestAnimationFrame(animateMicrophoneBars);
}

// ==============================================================================
// 3. Streaming Speaker Diarization Engine
// ==============================================================================
function startDiarizationStream() {
  stopDiarizationStream();

  // Ingest first turn immediately if none present
  if (state.currentTurns.length === 0 && sampleTurns.length > 0) {
    ingestNextTurn();
  }

  state.streamInterval = setInterval(() => {
    ingestNextTurn();
  }, 4000);
}

function stopDiarizationStream() {
  if (state.streamInterval) {
    clearInterval(state.streamInterval);
    state.streamInterval = null;
  }
}

function ingestNextTurn() {
  if (state.turnIndex >= sampleTurns.length) {
    // Loop back or hold
    state.turnIndex = 0;
  }

  const turn = sampleTurns[state.turnIndex++];
  state.currentTurns.push(turn);
  renderDiarizationTurn(turn);

  const chunkCount = document.getElementById("chunk-count");
  if (chunkCount) chunkCount.textContent = `${state.currentTurns.length} Turns Ingested`;

  logPipelineEvent(`[Transcribe Diarization] Attributed ${turn.speaker} (${(turn.confidence * 100).toFixed(0)}% conf): "${turn.text.substring(0, 40)}..."`);
}

function renderDiarizationTurn(turn) {
  const container = document.getElementById("transcript-stream");
  if (!container) return;

  const div = document.createElement("div");
  div.className = `diarization-turn ${turn.speakerTag}`;
  div.innerHTML = `
    <div class="turn-meta">
      <span class="turn-speaker">
        <span class="speaker-badge" style="background: var(--${turn.speakerTag}-bg); color: var(--${turn.speakerTag});">
          ${turn.speaker}
        </span>
        <span style="font-size:0.75rem; color: var(--text-subtle);">(${(turn.confidence * 100).toFixed(0)}% diarization match)</span>
      </span>
      <span class="turn-time">[${turn.timestamp}]</span>
    </div>
    <div class="turn-text">${escapeHtml(turn.text)}</div>
  `;

  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

// ==============================================================================
// 4. Action Items & Structured JSON Extraction
// ==============================================================================
function setupActionItems() {
  renderActionItems();
}

function renderActionItems() {
  const container = document.getElementById("action-items-container");
  if (!container) return;

  container.innerHTML = "";
  actionItems.forEach(item => {
    const card = document.createElement("div");
    card.className = `action-item-card ${item.completed ? "completed" : ""}`;
    card.innerHTML = `
      <input type="checkbox" class="action-checkbox" ${item.completed ? "checked" : ""} data-id="${item.id}">
      <div class="action-content">
        <div class="action-title">${escapeHtml(item.task)}</div>
        <div class="action-meta">
          <span>Assignee: <strong>${escapeHtml(item.owner)}</strong></span>
          <span class="priority-badge priority-${item.priority.toLowerCase()}">${item.priority} Priority</span>
        </div>
      </div>
    `;

    const checkbox = card.querySelector(".action-checkbox");
    checkbox.addEventListener("change", (e) => {
      item.completed = e.target.checked;
      card.classList.toggle("completed", item.completed);
      updateStructuredJsonView();
      logPipelineEvent(`Action item [${item.id}] updated in DynamoDB: completed=${item.completed}`);
    });

    container.appendChild(card);
  });
}

function updateStructuredJsonView() {
  const jsonViewer = document.getElementById("action-items-json");
  if (!jsonViewer) return;

  const payload = {
    meetingId: "meeting-001",
    model: "anthropic.claude-3-5-sonnet-20241022-v2:0",
    service: "Amazon Bedrock",
    extractedAt: new Date().toISOString(),
    executiveSummary: "Agreed upon the asynchronous event-driven cloud architecture for AI Meeting Notes Agent, incorporating Amazon Transcribe with speaker diarization, chunked Bedrock Knowledge Base vector store, and CI/CD fixtures with DLQ alerting.",
    actionItems: actionItems,
    keyDecisions: [
      "Adopt Amazon Transcribe streaming with speaker diarization enabled",
      "Vector store: OpenSearch Serverless via Bedrock Knowledge Base",
      "Setup DLQ with CloudWatch alarms for corrupted audio recovery"
    ]
  };

  jsonViewer.textContent = JSON.stringify(payload, null, 2);
}

// ==============================================================================
// 5. RAG Q&A Assistant with Speaker Citations
// ==============================================================================
function setupRAG() {
  const sendBtn = document.getElementById("rag-send-btn");
  const input = document.getElementById("rag-input");

  if (sendBtn && input) {
    sendBtn.addEventListener("click", () => handleRAGQuery());
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleRAGQuery();
    });
  }

  const presets = document.querySelectorAll(".preset-pill");
  presets.forEach(pill => {
    pill.addEventListener("click", () => {
      if (input) {
        input.value = pill.textContent.trim();
        handleRAGQuery();
      }
    });
  });
}

async function handleRAGQuery() {
  const input = document.getElementById("rag-input");
  if (!input) return;

  const query = input.value.trim();
  if (!query) return;

  input.value = "";
  appendRAGMessage(query, "user");

  const typingId = appendRAGTyping();

  try {
    let result = null;

    // 1. Try Java Backend Server API
    try {
      const resp = await fetch("/api/rag/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query })
      });
      if (resp.ok) {
        result = await resp.json();
      }
    } catch (netErr) {
      // Backend not running on this origin; fallback to client RAG
    }

    // 2. Fallback in-browser RAG if server offline
    if (!result) {
      await sleep(600);
      result = clientFallbackRAG(query);
    }

    removeRAGTyping(typingId);
    renderRAGResponse(result);

  } catch (err) {
    removeRAGTyping(typingId);
    appendRAGMessage("Sorry, an error occurred while searching meeting records: " + err.message, "agent");
  }
}

function appendRAGMessage(text, role) {
  const container = document.getElementById("rag-messages");
  if (!container) return;

  const div = document.createElement("div");
  div.className = `rag-msg ${role}`;
  div.textContent = text;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function appendRAGTyping() {
  const container = document.getElementById("rag-messages");
  if (!container) return null;

  const id = "typing-" + Date.now();
  const div = document.createElement("div");
  div.id = id;
  div.className = "rag-msg agent";
  div.style.color = "var(--text-muted)";
  div.textContent = "Searching Bedrock Knowledge Base vector chunks...";
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return id;
}

function removeRAGTyping(id) {
  if (!id) return;
  const elem = document.getElementById(id);
  if (elem) elem.remove();
}

function renderRAGResponse(res) {
  const container = document.getElementById("rag-messages");
  if (!container) return;

  const div = document.createElement("div");
  div.className = "rag-msg agent";

  let citationsHtml = "";
  if (res.citations && res.citations.length > 0) {
    citationsHtml = res.citations.map(c => `
      <div class="citation-box">
        <div class="citation-header">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          ${escapeHtml(c.speaker)} &bull; [${c.timestamp}] (Relevance: ${c.score ? c.score.toFixed(1) : "95%"})
        </div>
        <div>${escapeHtml(c.content || c.text || "")}</div>
      </div>
    `).join("");
  }

  div.innerHTML = `
    <div>${escapeHtml(res.answer)}</div>
    ${citationsHtml}
  `;

  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function clientFallbackRAG(query) {
  const lower = query.toLowerCase();

  if (lower.includes("bob") || lower.includes("diarization") || lower.includes("speaker")) {
    return {
      query: query,
      answer: "Bob (ML Engineer) stated that Amazon Transcribe streaming with speaker diarization will identify distinct speakers and emit timestamped segments. He emphasized preserving speaker attribution and timestamps when chunking for OpenSearch Serverless.",
      citations: [
        { speaker: "Bob (ML Engineer)", timestamp: "00:04", content: "[00:04] Bob: For the audio ingest, Amazon Transcribe streaming with speaker diarization will identify distinct speakers and emit timestamped segments.", score: 0.98 },
        { speaker: "Bob (ML Engineer)", timestamp: "00:12", content: "[00:12] Bob: For RAG, we must chunk transcripts preserving speaker attribution and start/end timestamps.", score: 0.95 }
      ]
    };
  }

  if (lower.includes("async") || lower.includes("event") || lower.includes("architecture")) {
    return {
      query: query,
      answer: "The architecture is fully asynchronous and event-driven. Raw audio uploaded to Amazon S3 triggers EventBridge, which invokes AWS Lambda to orchestrate Amazon Transcribe, Amazon Bedrock summarization, OpenSearch Serverless vector indexing, DynamoDB metadata syncing, and SES email dispatch.",
      citations: [
        { speaker: "Alice (Cloud Architect)", timestamp: "00:08", content: "[00:08] Alice: Remember, we must use an asynchronous event-driven architecture with Amazon S3 and EventBridge, not synchronous request-response.", score: 0.99 }
      ]
    };
  }

  if (lower.includes("ci/cd") || lower.includes("dlq") || lower.includes("fail") || lower.includes("test")) {
    return {
      query: query,
      answer: "Charlie (DevOps Lead) specified three key CI/CD practices: (1) Sample audio fixtures to regression-test transcription quality, (2) Dead-Letter Queues (DLQ) to capture and alert on failed transcription jobs, and (3) Staged shadow pipeline deployments to validate real meeting quality before cutover.",
      citations: [
        { speaker: "Charlie (DevOps Lead)", timestamp: "00:17", content: "[00:17] Charlie: For CI/CD, we need sample audio fixtures in regression tests, DLQ for failed transcription jobs, and a shadow pipeline before final cutover.", score: 0.98 }
      ]
    };
  }

  return {
    query: query,
    answer: "Amazon Bedrock (Claude 3.5) processes chunked transcripts to generate executive summaries and structured JSON action items with assignees and priorities. These records are indexed in OpenSearch Serverless and saved in DynamoDB.",
    citations: [
      { speaker: "Alice (Cloud Architect)", timestamp: "00:22", content: "[00:22] Alice: Bedrock Claude 3.5 will extract action items into structured JSON, save to DynamoDB, and trigger SNS/SES email summaries to attendees.", score: 0.97 }
    ]
  };
}

// ==============================================================================
// 6. AWS Pipeline Simulator & DLQ Error Injection
// ==============================================================================
function setupPipelineSimulation() {
  const simBtn = document.getElementById("trigger-pipeline-btn");
  if (simBtn) simBtn.addEventListener("click", runPipelineSimulation);

  const dlqBtn = document.getElementById("trigger-dlq-btn");
  if (dlqBtn) dlqBtn.addEventListener("click", runDLQSimulation);
}

async function runPipelineSimulation() {
  const simBtn = document.getElementById("trigger-pipeline-btn");
  if (simBtn) simBtn.disabled = true;

  resetPipelineNodes();
  logPipelineEvent("🚀 Initiating asynchronous event pipeline simulation...");

  const stages = [
    { id: "node-s3", name: "Amazon S3", log: "Audio file meeting_rec_20261014.wav uploaded to s3://meeting-notes-raw-audio/" },
    { id: "node-eventbridge", name: "Amazon EventBridge", log: "Event rule matched: aws.s3 ObjectCreated -> Routed to Lambda orchestrator" },
    { id: "node-lambda", name: "AWS Lambda", log: "Lambda orchestrator invoked asynchronously; started execution token exec-8f2a" },
    { id: "node-transcribe", name: "Amazon Transcribe", log: "Streaming Speech-to-Text completed with Speaker Diarization (Alice, Bob, Charlie)" },
    { id: "node-bedrock", name: "Amazon Bedrock", log: "Bedrock Claude 3.5 extracted structured JSON: Summary, Decisions, and Action Items" },
    { id: "node-opensearch", name: "OpenSearch Serverless", log: "Speaker-attributed timestamped chunks vectorized into Bedrock Knowledge Base" },
    { id: "node-dynamodb", name: "Amazon DynamoDB", log: "Meeting metadata, attendee records, and action items persisted to DynamoDB" },
    { id: "node-sns", name: "Amazon SNS / SES", log: "Meeting summary email dispatched to 4 attendees within 2.4s total pipeline latency!" }
  ];

  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i];
    const elem = document.getElementById(stage.id);
    if (elem) elem.classList.add("active");

    logPipelineEvent(`[Step ${i + 1}/8] ${stage.name}: ${stage.log}`);
    await sleep(650);

    if (elem) {
      elem.classList.remove("active");
      elem.classList.add("success");
    }
  }

  logPipelineEvent("✅ Async Event Pipeline Completed Successfully! All records indexed.");
  if (simBtn) simBtn.disabled = false;
}

async function runDLQSimulation() {
  const dlqBtn = document.getElementById("trigger-dlq-btn");
  if (dlqBtn) dlqBtn.disabled = true;

  resetPipelineNodes();
  logPipelineEvent("⚠️ Testing Dead-Letter Queue (DLQ) with corrupted audio stream...");

  const s3Elem = document.getElementById("node-s3");
  const transcribeElem = document.getElementById("node-transcribe");

  if (s3Elem) s3Elem.classList.add("active");
  await sleep(500);
  if (s3Elem) { s3Elem.classList.remove("active"); s3Elem.classList.add("success"); }

  if (transcribeElem) transcribeElem.classList.add("active");
  logPipelineEvent("[Amazon Transcribe] Ingesting corrupted_sample.opus...");
  await sleep(700);

  if (transcribeElem) {
    transcribeElem.classList.remove("active");
    transcribeElem.classList.add("error");
  }

  logPipelineEvent("❌ [ERROR] TranscribeAudioCorruptedException: Header CRC mismatch on input stream");
  logPipelineEvent("🔄 [EventBridge] Retry Attempt 1/3 failed. Retry Attempt 2/3 failed. Retry Attempt 3/3 failed.");
  logPipelineEvent("📬 [DLQ] Message routed to arn:aws:sqs:us-east-1:123456789012:meeting-transcription-dlq");
  logPipelineEvent("🚨 [CloudWatch] Alarm 'HighDLQMessageCountAlarm' triggered! DevOps on-call notified via SNS.");

  await sleep(1000);
  if (dlqBtn) dlqBtn.disabled = false;
}

function resetPipelineNodes() {
  const nodes = document.querySelectorAll(".pipeline-node");
  nodes.forEach(n => n.classList.remove("active", "success", "error"));
}

function logPipelineEvent(msg) {
  const terminal = document.getElementById("pipeline-terminal");
  if (!containerExists(terminal)) return;

  const time = new Date().toLocaleTimeString();
  const line = document.createElement("div");
  line.textContent = `[${time}] ${msg}`;
  terminal.appendChild(line);
  terminal.scrollTop = terminal.scrollHeight;
}

// ==============================================================================
// 7. Backend Health Polling
// ==============================================================================
async function checkBackendHealth() {
  const dot = document.getElementById("backend-dot");
  const text = document.getElementById("backend-text");

  try {
    const res = await fetch("/api/status");
    if (res.ok) {
      const data = await res.json();
      state.isBackendConnected = true;
      if (dot) {
        dot.className = "status-dot online";
      }
      if (text) {
        text.textContent = `Java Server Online (Port ${data.port || 8080})`;
      }
      return;
    }
  } catch (e) {
    // Backend offline / static file view
  }

  state.isBackendConnected = false;
  if (dot) {
    dot.className = "status-dot offline";
  }
  if (text) {
    text.textContent = "Browser Standalone Mode (Zero Setup)";
  }
}

// Utility Helpers
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function containerExists(elem) {
  return elem !== null && elem !== undefined;
}
