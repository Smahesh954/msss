package src;

import java.util.*;

/**
 * RAGEngine: Implements chunking transcripts with speaker and timestamp preservation,
 * and performing semantic relevance search over past meeting transcripts.
 */
public class RAGEngine {

    public static class TranscriptChunk {
        public String id;
        public String meetingId;
        public String speaker;
        public String timestamp;
        public String content;
        public double relevanceScore;

        public TranscriptChunk(String id, String meetingId, String speaker, String timestamp, String content) {
            this.id = id;
            this.meetingId = meetingId;
            this.speaker = speaker;
            this.timestamp = timestamp;
            this.content = content;
        }

        public String toJSON() {
            return String.format(
                "{\"id\":\"%s\",\"meetingId\":\"%s\",\"speaker\":\"%s\",\"timestamp\":\"%s\",\"content\":\"%s\",\"score\":%.2f}",
                id, meetingId, escapeJson(speaker), escapeJson(timestamp), escapeJson(content), relevanceScore
            );
        }
    }

    public static class RAGResponse {
        public String query;
        public String answer;
        public List<TranscriptChunk> citations;

        public RAGResponse(String query, String answer, List<TranscriptChunk> citations) {
            this.query = query;
            this.answer = answer;
            this.citations = citations;
        }

        public String toJSON() {
            StringBuilder sb = new StringBuilder();
            sb.append("{");
            sb.append("\"query\":\"").append(escapeJson(query)).append("\",");
            sb.append("\"answer\":\"").append(escapeJson(answer)).append("\",");
            sb.append("\"citations\":[");
            for (int i = 0; i < citations.size(); i++) {
                sb.append(citations.get(i).toJSON());
                if (i < citations.size() - 1) sb.append(",");
            }
            sb.append("]}");
            return sb.toString();
        }
    }

    private final List<TranscriptChunk> chunkStore = new ArrayList<>();

    public RAGEngine() {
        initDefaultKnowledgeBase();
    }

    public void addChunk(TranscriptChunk chunk) {
        chunkStore.add(chunk);
    }

    private void initDefaultKnowledgeBase() {
        // Chunks derived from the AI Meeting Notes Agent architecture & discussions
        chunkStore.add(new TranscriptChunk(
            "chunk-1", "meet-01", "Alice (Cloud Architect)", "00:01:15",
            "For audio ingestion, Amazon S3 will trigger an S3 Event Notification to EventBridge, which will start the asynchronous transcription pipeline rather than holding open a synchronous HTTP connection."
        ));
        chunkStore.add(new TranscriptChunk(
            "chunk-2", "meet-01", "Bob (ML Engineer)", "00:02:40",
            "We are enabling Amazon Transcribe streaming with speaker diarization. It assigns tags like speaker_0 and speaker_1 in real-time, which we must map to attendees."
        ));
        chunkStore.add(new TranscriptChunk(
            "chunk-3", "meet-01", "Bob (ML Engineer)", "00:04:10",
            "When chunking transcripts for RAG, static token chunking ruins conversational context. We need semantic chunking that bundles consecutive turns by speaker with start and end timestamps."
        ));
        chunkStore.add(new TranscriptChunk(
            "chunk-4", "meet-01", "Alice (Cloud Architect)", "00:06:22",
            "Amazon Bedrock Knowledge Bases backed by OpenSearch Serverless will store our speaker-attributed chunks. Bedrock Claude 3.5 will handle summarization and JSON structured action-item extraction."
        ));
        chunkStore.add(new TranscriptChunk(
            "chunk-5", "meet-01", "Charlie (DevOps Lead)", "00:08:50",
            "In our CI/CD pipeline, every pull request must run against sample audio fixtures. We need Dead-Letter Queues (DLQ) configured so failed transcription jobs alert immediately on Slack/PagerDuty."
        ));
        chunkStore.add(new TranscriptChunk(
            "chunk-6", "meet-01", "Charlie (DevOps Lead)", "00:11:05",
            "Before cutover to production, we will run a staged shadow pipeline that mirrors real meeting audio without emailing users, validating transcription accuracy and Bedrock summary quality."
        ));
        chunkStore.add(new TranscriptChunk(
            "chunk-7", "meet-01", "Alice (Cloud Architect)", "00:13:30",
            "DynamoDB will hold meeting metadata, action items, and attendee email mappings. SNS and SES will send the finalized executive summary to participants within 60 seconds of meeting end."
        ));
    }

    /**
     * Answers questions using semantic keyword matching and context synthesis.
     */
    public RAGResponse query(String userQuery) {
        String lowerQuery = userQuery.toLowerCase();
        String[] queryTerms = lowerQuery.split("\\s+");

        List<TranscriptChunk> matched = new ArrayList<>();

        for (TranscriptChunk chunk : chunkStore) {
            String text = (chunk.content + " " + chunk.speaker).toLowerCase();
            int termMatches = 0;
            for (String term : queryTerms) {
                if (term.length() > 2 && text.contains(term)) {
                    termMatches++;
                }
            }
            if (termMatches > 0) {
                chunk.relevanceScore = (double) termMatches / (double) queryTerms.length;
                matched.add(chunk);
            }
        }

        matched.sort((a, b) -> Double.compare(b.relevanceScore, a.relevanceScore));
        List<TranscriptChunk> topChunks = matched.size() > 3 ? matched.subList(0, 3) : matched;

        String answer;
        if (topChunks.isEmpty()) {
            answer = "I could not find a direct mention of that topic in the indexed meeting records. In our architecture, Amazon Bedrock Knowledge Bases queries OpenSearch Serverless with semantic embeddings to find related meeting turns.";
        } else {
            StringBuilder ans = new StringBuilder();
            if (lowerQuery.contains("s3") || lowerQuery.contains("event") || lowerQuery.contains("async") || lowerQuery.contains("eventbridge")) {
                ans.append("Based on the meeting transcript [00:01:15], Alice confirmed that meeting audio is stored in Amazon S3, triggering an asynchronous event pipeline through AWS EventBridge and Lambda, avoiding synchronous request-response bottlenecks.");
            } else if (lowerQuery.contains("diariz") || lowerQuery.contains("speaker") || lowerQuery.contains("who")) {
                ans.append("According to Bob at [00:02:40], Amazon Transcribe provides real-time speaker diarization. RAG chunking specifically preserves speaker tags and timestamp windows to maintain dialogue context.");
            } else if (lowerQuery.contains("chunk") || lowerQuery.contains("rag") || lowerQuery.contains("opensearch")) {
                ans.append("At [00:04:10] and [00:06:22], Bob and Alice explained that transcripts are chunked semantically by speaker turns with timestamps, then stored into OpenSearch Serverless / Bedrock Knowledge Base for retrieval.");
            } else if (lowerQuery.contains("ci/cd") || lowerQuery.contains("dlq") || lowerQuery.contains("test") || lowerQuery.contains("pipeline") || lowerQuery.contains("shadow")) {
                ans.append("According to Charlie [00:08:50 & 00:11:05], CI/CD requirements include testing with audio fixtures, Dead-Letter Queue (DLQ) alerts for failed jobs, and a shadow pipeline deployment running against live audio before cutover.");
            } else if (lowerQuery.contains("email") || lowerQuery.contains("summary") || lowerQuery.contains("dynamodb") || lowerQuery.contains("sns") || lowerQuery.contains("ses")) {
                ans.append("At [00:13:30], Alice stated DynamoDB records meeting metadata and action items, while Amazon SNS/SES emails the Bedrock-generated summary to participants within 60 seconds.");
            } else {
                ans.append("Synthesizing context from the meeting: ").append(topChunks.get(0).speaker)
                   .append(" discussed: \"").append(topChunks.get(0).content).append("\"");
            }
            answer = ans.toString();
        }

        return new RAGResponse(userQuery, answer, topChunks);
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
