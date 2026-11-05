# 8. AI Meeting Notes Agent (Background Recorder)

> Complete implementation of **Project 8: AI Meeting Notes Agent (Background Recorder)**, cleanly divided into dedicated **HTML**, **CSS**, **Java**, and **JavaScript** files.

---

## 📁 Clean File Breakdown

As requested, the application is divided into dedicated, clean files:

| File | Type | Description |
|---|---|---|
| [**`index.html`**](file:///C:/Users/mahes/.gemini/antigravity/scratch/ai-meeting-notes-agent/index.html) | **HTML** | Master UI containing the Live Recorder, Speaker Diarization feed, Action Items checklist, RAG Q&A Assistant, AWS 8-Stage Architecture Flow, and Meeting Archive. |
| [**`style.css`**](file:///C:/Users/mahes/.gemini/antigravity/scratch/ai-meeting-notes-agent/style.css) | **CSS** | Master stylesheet containing responsive grid layouts, sleek dark theme, audio waveform visualizer animations, speaker avatar badges, chat bubbles, and pipeline nodes. |
| [**`MeetingNotesServer.java`**](file:///C:/Users/mahes/.gemini/antigravity/scratch/ai-meeting-notes-agent/MeetingNotesServer.java) | **Java** | Standalone zero-dependency OpenJDK backend server, REST API endpoints, speaker-attributed timestamped chunking engine, vector RAG semantic search, and DLQ simulator. |
| [**`app.js`**](file:///C:/Users/mahes/.gemini/antigravity/scratch/ai-meeting-notes-agent/app.js) | **JavaScript** | Client engine managing the Web Audio API microphone stream, real-time waveform visualization, live diarization feed, interactive RAG chat, and AWS pipeline animations. |
| [**`run.bat`**](file:///C:/Users/mahes/.gemini/antigravity/scratch/ai-meeting-notes-agent/run.bat) | **Batch Script** | 1-click Windows launcher that compiles and starts `MeetingNotesServer.java` on port `8080`. |

---

## 🚀 How to Run the Application

### Option A: With the Java Server (Port 8080)
1. Double-click [**`run.bat`**](file:///C:/Users/mahes/.gemini/antigravity/scratch/ai-meeting-notes-agent/run.bat) or open PowerShell in this directory:
   ```powershell
   cd C:\Users\mahes\.gemini\antigravity\scratch\ai-meeting-notes-agent
   javac MeetingNotesServer.java
   java MeetingNotesServer
   ```
2. Open your browser and navigate to:
   ```
   http://localhost:8080
   ```
   The header pill will illuminate green: **`Java Server Online (Port 8080)`**.

### Option B: Standalone Browser Mode (Zero Setup)
Simply double-click or open [**`index.html`**](file:///C:/Users/mahes/.gemini/antigravity/scratch/ai-meeting-notes-agent/index.html) directly in any web browser (Chrome, Edge, Firefox). The client engine includes built-in fallback semantic matching, audio waveform rendering, and pipeline simulations directly in the browser!

---

## 🎯 Project 8 Core Concepts Implemented

### 1. Real-Time Streaming Audio Transcription Pipeline
- Ingests audio streams (16kHz Opus/WAV) using the **Web Audio API** and microphone access with real-time animated waveform bars.

### 2. Speaker Diarization
- Accurately tags utterances with distinct speaker attribution:
  - **Alice (Cloud Architect)** (`speaker-1`)
  - **Bob (ML Engineer)** (`speaker-2`)
  - **Charlie (DevOps Lead)** (`speaker-3`)
- Displays start/end timestamps (`[00:01]`, `[00:04]`, ...) and confidence scores.

### 3. Speaker & Timestamp-Preserving Chunking for RAG
- Transcripts are chunked preserving speaker context and time boundaries:
  ```
  [00:04] Bob (ML Engineer): For the audio ingest, Amazon Transcribe streaming with speaker diarization will identify distinct speakers and emit timestamped segments.
  ```
- Vectors are stored with metadata to enable exact citation retrieval during Q&A.

### 4. Structured LLM Output (Amazon Bedrock Schema)
- Extracts executive summaries, key decisions, and prioritized action items:
  - Task description
  - Assignee/owner
  - Priority badge (`HIGH`, `MEDIUM`, `LOW`)
  - Completion status toggle with live JSON schema updates.

### 5. Decoupled Asynchronous AWS Event-Driven Architecture
- Visualizes and simulates the full 8-service decoupled pipeline:
  $$\text{Amazon S3} \longrightarrow \text{EventBridge} \longrightarrow \text{AWS Lambda} \longrightarrow \text{Amazon Transcribe} \longrightarrow \text{Amazon Bedrock} \longrightarrow \text{OpenSearch} \longrightarrow \text{DynamoDB} \longrightarrow \text{SNS / SES}$$
- Demonstrates why asynchronous event routing is used instead of synchronous request-response.

### 6. CI/CD & Dead-Letter Queue (DLQ) Reliability
- **Sample Audio Fixtures**: Used in CI to regression-test transcription quality.
- **Dead-Letter Queue (DLQ) Testing**: Interactive simulation button injects corrupted audio payloads to test 3-attempt retries, SQS DLQ routing, and CloudWatch/SNS on-call alerting.
- **Shadow Pipeline Deployment**: Staged rollouts that process real meetings in shadow mode before live cutover.
