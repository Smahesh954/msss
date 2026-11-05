/**
 * AI Meeting Notes Agent - RAG Assistant
 * Implements Retrieval-Augmented Generation query dispatch,
 * speaker citation attribution, and interactive question-answering.
 */

document.addEventListener("DOMContentLoaded", () => {
  setupRAGEventListeners();
});

function setupRAGEventListeners() {
  const sendBtn = document.getElementById("rag-send-btn");
  const input = document.getElementById("rag-input");

  if (sendBtn && input) {
    sendBtn.addEventListener("click", () => handleRAGQuery());
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleRAGQuery();
    });
  }

  // Preset query pills
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

  const typingId = appendRAGTypingIndicator();

  try {
    let result = null;

    // Try Java backend API first
    try {
      const resp = await fetch("/api/rag/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query })
      });
      if (resp.ok) {
        result = await resp.json();
      }
    } catch (e) {
      // Backend not running; fallback to client RAG
    }

    if (!result) {
      result = performClientRAG(query);
    }

    removeRAGTypingIndicator(typingId);
    appendRAGAnswer(result);
  } catch (err) {
    removeRAGTypingIndicator(typingId);
    appendRAGMessage("Sorry, an error occurred while searching the meeting index.", "agent");
  }
}

function appendRAGMessage(text, sender) {
  const container = document.getElementById("rag-messages");
  if (!container) return;

  const msg = document.createElement("div");
  msg.className = `rag-msg ${sender}`;
  msg.textContent = text;
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
}

function appendRAGTypingIndicator() {
  const container = document.getElementById("rag-messages");
  if (!container) return null;

  const id = "typing-" + Date.now();
  const msg = document.createElement("div");
  msg.id = id;
  msg.className = "rag-msg agent";
  msg.innerHTML = `<em>Retrieving speaker-attributed chunks from Bedrock / OpenSearch...</em>`;
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
  return id;
}

function removeRAGTypingIndicator(id) {
  if (!id) return;
  const elem = document.getElementById(id);
  if (elem) elem.remove();
}

function appendRAGAnswer(result) {
  const container = document.getElementById("rag-messages");
  if (!container) return;

  const msg = document.createElement("div");
  msg.className = "rag-msg agent";

  let citationsHtml = "";
  if (result.citations && result.citations.length > 0) {
    citationsHtml = `
      <div class="rag-citation-box">
        <div class="rag-citation-title">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          Cited Meeting Timestamp & Speaker:
        </div>
        ${result.citations.map(c => `
          <div style="margin-top: 4px; font-size: 0.75rem; color: #cbd5e1;">
            <strong>${escapeHtml(c.speaker)}</strong> <span class="timestamp-pill">[${escapeHtml(c.timestamp)}]</span>:
            <em>"${escapeHtml(c.content)}"</em>
          </div>
        `).join("")}
      </div>
    `;
  }

  msg.innerHTML = `
    <div>${escapeHtml(result.answer)}</div>
    ${citationsHtml}
  `;

  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
}

// Client-side RAG fallback engine
function performClientRAG(query) {
  const q = query.toLowerCase();

  const chunks = [
    {
      speaker: "Alice (Cloud Architect)",
      timestamp: "00:01:15",
      content: "Amazon S3 triggers an event notification to EventBridge, which starts the asynchronous transcription pipeline rather than holding open a synchronous HTTP connection."
    },
    {
      speaker: "Bob (ML Engineer)",
      timestamp: "00:02:40",
      content: "Amazon Transcribe streaming with speaker diarization identifies who is speaking so RAG queries can accurately cite speakers."
    },
    {
      speaker: "Bob (ML Engineer)",
      timestamp: "00:04:10",
      content: "We must preserve speaker-turns and start/end timestamps when chunking transcripts for RAG, avoiding static token chunking."
    },
    {
      speaker: "Alice (Cloud Architect)",
      timestamp: "00:06:22",
      content: "Bedrock Knowledge Bases backed by OpenSearch Serverless stores the chunks. Bedrock Claude handles summarization and structured JSON extraction."
    },
    {
      speaker: "Charlie (DevOps Lead)",
      timestamp: "00:08:50",
      content: "CI/CD requirements include sample audio fixtures, Dead-Letter Queues (DLQ) for failed transcription jobs, and shadow pipelines."
    },
    {
      speaker: "Alice (Cloud Architect)",
      timestamp: "00:13:30",
      content: "DynamoDB holds meeting metadata and action items. SNS and SES email the finalized summary to attendees within 60 seconds."
    }
  ];

  let matchedChunks = [];
  let answer = "";

  if (q.includes("async") || q.includes("event") || q.includes("s3") || q.includes("architecture")) {
    matchedChunks = [chunks[0]];
    answer = "Alice explained that audio uploads to Amazon S3 trigger an asynchronous EventBridge rule to invoke Lambda, avoiding synchronous request-response connection timeouts on long meetings.";
  } else if (q.includes("diariz") || q.includes("speaker") || q.includes("bob") || q.includes("chunk")) {
    matchedChunks = [chunks[1], chunks[2]];
    answer = "Bob emphasized using Amazon Transcribe streaming with speaker diarization, and ensuring RAG chunks preserve speaker turns and timestamps rather than static token slicing.";
  } else if (q.includes("ci/cd") || q.includes("test") || q.includes("dlq") || q.includes("shadow") || q.includes("charlie")) {
    matchedChunks = [chunks[4]];
    answer = "Charlie specified CI/CD requirements: regression-testing with sample audio fixtures, Dead-Letter Queues (DLQ) for alerting on failed audio, and a staged shadow pipeline prior to cutover.";
  } else if (q.includes("email") || q.includes("dynamodb") || q.includes("summary") || q.includes("action")) {
    matchedChunks = [chunks[3], chunks[5]];
    answer = "DynamoDB stores the meeting metadata and extracted action items, while Bedrock generates the structured summary emailed to attendees via Amazon SNS/SES.";
  } else {
    matchedChunks = [chunks[0], chunks[1]];
    answer = `Based on the AI Meeting Notes Agent roadmap, the system runs as a background service ingesting audio, transcribing via Amazon Transcribe with diarization, and querying via Bedrock RAG.`;
  }

  return {
    query: query,
    answer: answer,
    citations: matchedChunks
  };
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
