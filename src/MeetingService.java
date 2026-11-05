package src;

import java.util.*;

/**
 * MeetingService: Coordinates meeting session data, real-time speaker diarization turns,
 * structured action-item extraction, and asynchronous pipeline event simulation.
 */
public class MeetingService {

    public static class SpeakerTurn {
        public String speaker;
        public String speakerTag; // e.g. speaker-1, speaker-2
        public String timestamp;
        public String text;
        public double confidence;

        public SpeakerTurn(String speaker, String speakerTag, String timestamp, String text, double confidence) {
            this.speaker = speaker;
            this.speakerTag = speakerTag;
            this.timestamp = timestamp;
            this.text = text;
            this.confidence = confidence;
        }

        public String toJSON() {
            return String.format(
                "{\"speaker\":\"%s\",\"speakerTag\":\"%s\",\"timestamp\":\"%s\",\"text\":\"%s\",\"confidence\":%.2f}",
                escapeJson(speaker), escapeJson(speakerTag), escapeJson(timestamp), escapeJson(text), confidence
            );
        }
    }

    public static class ActionItem {
        public String id;
        public String task;
        public String owner;
        public String priority; // HIGH, MEDIUM, LOW
        public boolean completed;

        public ActionItem(String id, String task, String owner, String priority, boolean completed) {
            this.id = id;
            this.task = task;
            this.owner = owner;
            this.priority = priority;
            this.completed = completed;
        }

        public String toJSON() {
            return String.format(
                "{\"id\":\"%s\",\"task\":\"%s\",\"owner\":\"%s\",\"priority\":\"%s\",\"completed\":%b}",
                id, escapeJson(task), escapeJson(owner), priority, completed
            );
        }
    }

    public static class Meeting {
        public String id;
        public String title;
        public String date;
        public String status; // PROCESSING, INDEXED, LIVE
        public List<SpeakerTurn> transcript = new ArrayList<>();
        public List<ActionItem> actionItems = new ArrayList<>();
        public List<String> decisions = new ArrayList<>();
        public String summary;

        public Meeting(String id, String title, String date, String status) {
            this.id = id;
            this.title = title;
            this.date = date;
            this.status = status;
        }

        public String toJSON() {
            StringBuilder sb = new StringBuilder();
            sb.append("{");
            sb.append("\"id\":\"").append(id).append("\",");
            sb.append("\"title\":\"").append(escapeJson(title)).append("\",");
            sb.append("\"date\":\"").append(date).append("\",");
            sb.append("\"status\":\"").append(status).append("\",");
            sb.append("\"summary\":\"").append(escapeJson(summary == null ? "" : summary)).append("\",");

            sb.append("\"transcript\":[");
            for (int i = 0; i < transcript.size(); i++) {
                sb.append(transcript.get(i).toJSON());
                if (i < transcript.size() - 1) sb.append(",");
            }
            sb.append("],");

            sb.append("\"actionItems\":[");
            for (int i = 0; i < actionItems.size(); i++) {
                sb.append(actionItems.get(i).toJSON());
                if (i < actionItems.size() - 1) sb.append(",");
            }
            sb.append("],");

            sb.append("\"decisions\":[");
            for (int i = 0; i < decisions.size(); i++) {
                sb.append("\"").append(escapeJson(decisions.get(i))).append("\"");
                if (i < decisions.size() - 1) sb.append(",");
            }
            sb.append("]");

            sb.append("}");
            return sb.toString();
        }
    }

    private final Map<String, Meeting> meetings = new LinkedHashMap<>();

    public MeetingService() {
        initSampleMeetings();
    }

    public List<Meeting> getAllMeetings() {
        return new ArrayList<>(meetings.values());
    }

    public Meeting getMeeting(String id) {
        return meetings.get(id);
    }

    private void initSampleMeetings() {
        Meeting m1 = new Meeting("meet-01", "AI Meeting Notes Agent Architecture Review", "2026-10-14", "INDEXED");
        m1.summary = "Agreed on an event-driven AWS architecture using Amazon Transcribe streaming with speaker diarization, S3 and EventBridge for decoupled async orchestration, Bedrock Claude 3.5 for structured extraction, and OpenSearch Serverless for RAG vector search.";

        m1.transcript.add(new SpeakerTurn("Alice (Cloud Architect)", "speaker-1", "00:01:15",
            "Welcome everyone. Today we are designing Project 8: AI Meeting Notes Agent as a background recorder. Let's walk through our async AWS ingestion pipeline.", 0.98));
        m1.transcript.add(new SpeakerTurn("Bob (ML Engineer)", "speaker-2", "00:02:40",
            "For transcription, we will connect to Amazon Transcribe streaming. The crucial feature is speaker diarization: identifying who is speaking so RAG queries can accurately cite speakers.", 0.96));
        m1.transcript.add(new SpeakerTurn("Alice (Cloud Architect)", "speaker-1", "00:04:10",
            "Exactly. Audio uploads directly to S3, triggering an EventBridge rule to invoke Lambda asynchronously. No long-lived synchronous server connections.", 0.99));
        m1.transcript.add(new SpeakerTurn("Bob (ML Engineer)", "speaker-2", "00:05:45",
            "When we chunk transcripts for RAG, we must not chunk blindly by tokens. We will preserve speaker-turns and timestamps inside each chunk before embedding into Bedrock Knowledge Bases / OpenSearch.", 0.97));
        m1.transcript.add(new SpeakerTurn("Charlie (DevOps Lead)", "speaker-3", "00:08:50",
            "On the CI/CD front, every PR must run regression tests against sample audio fixtures. We must also configure Dead-Letter Queues (DLQ) for failed transcription jobs.", 0.95));
        m1.transcript.add(new SpeakerTurn("Charlie (DevOps Lead)", "speaker-3", "00:11:05",
            "Before launching cutover, we will run a staged shadow pipeline that runs alongside real meetings without emailing summaries, to validate precision.", 0.94));
        m1.transcript.add(new SpeakerTurn("Alice (Cloud Architect)", "speaker-1", "00:13:30",
            "Great! DynamoDB will persist action items, and SNS/SES will email the Bedrock summary to attendees. Let's build the prototype.", 0.99));

        m1.actionItems.add(new ActionItem("act-1", "Implement Amazon Transcribe streaming client with speaker diarization parser", "Bob (ML Engineer)", "HIGH", false));
        m1.actionItems.add(new ActionItem("act-2", "Configure S3 -> EventBridge -> Lambda asynchronous event notification pipeline", "Alice (Cloud Architect)", "HIGH", false));
        m1.actionItems.add(new ActionItem("act-3", "Setup Dead-Letter Queue (DLQ) and shadow pipeline regression tests in GitHub Actions", "Charlie (DevOps Lead)", "MEDIUM", false));
        m1.actionItems.add(new ActionItem("act-4", "Define JSON schema for Bedrock Claude 3.5 structured action-item extraction", "Bob (ML Engineer)", "MEDIUM", true));

        m1.decisions.add("Selected Amazon Transcribe over Whisper for managed real-time streaming and AWS native diarization.");
        m1.decisions.add("Adopted EventBridge async decoupled architecture to avoid Lambda execution timeouts on long meetings.");
        m1.decisions.add("Mandated speaker-aware timestamped chunking strategy for OpenSearch Serverless RAG indexing.");

        meetings.put(m1.id, m1);

        Meeting m2 = new Meeting("meet-02", "Autonomous Coding Agent (OpenClaw) Planning", "2026-10-12", "INDEXED");
        m2.summary = "Explored project 9: OpenClaw-style autonomous coding agent utilizing a ReAct plan-execute-observe loop, sandboxed execution, and AST parsing.";
        m2.actionItems.add(new ActionItem("act-5", "Design sandboxed Docker execution runner for agent tool calls", "Charlie (DevOps Lead)", "HIGH", true));
        meetings.put(m2.id, m2);
    }

    private static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
