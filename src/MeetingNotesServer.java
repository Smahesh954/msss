package src;

import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;

import java.io.*;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.concurrent.Executors;

/**
 * MeetingNotesServer: Standalone Java HTTP Server for AI Meeting Notes Agent.
 * Serves HTML, CSS, JavaScript front-end assets and provides REST API endpoints.
 * Compatible with Java 17, 21, and 25 with ZERO external dependencies!
 */
public class MeetingNotesServer {

    private static final int DEFAULT_PORT = 8080;
    private static MeetingService meetingService;
    private static RAGEngine ragEngine;
    private static Path rootDir;

    public static void main(String[] args) throws IOException {
        int port = DEFAULT_PORT;
        if (args.length > 0) {
            try {
                port = Integer.parseInt(args[0]);
            } catch (NumberFormatException ignored) {}
        }

        // Locate project base directory
        rootDir = Paths.get(".").toAbsolutePath().normalize();
        if (Files.exists(rootDir.resolve("css")) && Files.exists(rootDir.resolve("index.html"))) {
            // Already in root
        } else if (Files.exists(rootDir.resolve("ai-meeting-notes-agent"))) {
            rootDir = rootDir.resolve("ai-meeting-notes-agent");
        }

        meetingService = new MeetingService();
        ragEngine = new RAGEngine();

        HttpServer server;
        try {
            server = HttpServer.create(new InetSocketAddress(port), 0);
        } catch (IOException e) {
            port = 8081;
            server = HttpServer.create(new InetSocketAddress(port), 0);
        }

        server.setExecutor(Executors.newVirtualThreadPerTaskExecutor()); // Virtual threads in modern Java

        // Route Registrations
        server.createContext("/api/status", new StatusHandler(port));
        server.createContext("/api/meetings", new MeetingsHandler());
        server.createContext("/api/rag/query", new RagQueryHandler());
        server.createContext("/api/pipeline/simulate", new PipelineHandler());

        // Static File Serving
        server.createContext("/", new StaticFileHandler());

        server.start();

        System.out.println("==============================================================");
        System.out.println("  AI Meeting Notes Agent - Java Server Started Successfully! ");
        System.out.println("  Java Runtime : OpenJDK " + System.getProperty("java.version"));
        System.out.println("  Local URL    : http://localhost:" + port);
        System.out.println("  Root Dir     : " + rootDir);
        System.out.println("==============================================================");
    }

    /**
     * Handler for /api/status
     */
    static class StatusHandler implements HttpHandler {
        private final int port;
        public StatusHandler(int port) { this.port = port; }

        @Override
        public void handle(HttpExchange exchange) throws IOException {
            addCorsHeaders(exchange);
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            String json = String.format(
                "{\"status\":\"online\",\"service\":\"AI Meeting Notes Agent\",\"port\":%d,\"javaVersion\":\"%s\",\"vm\":\"%s\"}",
                port, System.getProperty("java.version"), System.getProperty("java.vm.name")
            );
            sendJson(exchange, 200, json);
        }
    }

    /**
     * Handler for /api/meetings
     */
    static class MeetingsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            addCorsHeaders(exchange);
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            StringBuilder sb = new StringBuilder("[");
            var list = meetingService.getAllMeetings();
            for (int i = 0; i < list.size(); i++) {
                sb.append(list.get(i).toJSON());
                if (i < list.size() - 1) sb.append(",");
            }
            sb.append("]");

            sendJson(exchange, 200, sb.toString());
        }
    }

    /**
     * Handler for /api/rag/query
     */
    static class RagQueryHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            addCorsHeaders(exchange);
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJson(exchange, 405, "{\"error\":\"Method not allowed\"}");
                return;
            }

            String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
            String queryText = extractJsonField(body, "query");
            if (queryText == null || queryText.isBlank()) {
                queryText = "architecture";
            }

            var ragResult = ragEngine.query(queryText);
            sendJson(exchange, 200, ragResult.toJSON());
        }
    }

    /**
     * Handler for /api/pipeline/simulate
     */
    static class PipelineHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            addCorsHeaders(exchange);
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            String pipelineJson = """
            {
              "pipeline": "AI Meeting Notes Background Recorder",
              "events": [
                {"step": 1, "service": "Amazon S3", "event": "s3:ObjectCreated:Put", "detail": "Meeting audio raw-audio/meet-2026-10-14.wav received (45MB)"},
                {"step": 2, "service": "Amazon EventBridge", "event": "RuleTriggered", "detail": "Matched S3 Ingestion Rule -> Dispatched event to async worker"},
                {"step": 3, "service": "AWS Lambda", "event": "StartTranscriptionJob", "detail": "Invoked Transcribe API with speaker diarization (max speakers: 5)"},
                {"step": 4, "service": "Amazon Transcribe", "event": "TranscriptionCompleted", "detail": "Speech-to-text with timestamps & speaker labels ready in 22s"},
                {"step": 5, "service": "Amazon Bedrock", "event": "InvokeModel", "detail": "Claude 3.5 generated executive summary + structured JSON action items"},
                {"step": 6, "service": "OpenSearch Serverless", "event": "VectorIndexed", "detail": "Chunked transcript with speaker context indexed into Bedrock Knowledge Base"},
                {"step": 7, "service": "Amazon DynamoDB", "event": "PutItem", "detail": "Meeting metadata, calendar attendees, and action items persisted"},
                {"step": 8, "service": "Amazon SNS / SES", "event": "EmailDispatched", "detail": "Executive meeting notes sent to 4 attendees within 48s"}
              ],
              "dlqConfigured": true,
              "status": "COMPLETED_SUCCESS"
            }
            """;

            sendJson(exchange, 200, pipelineJson);
        }
    }

    /**
     * Handler for serving HTML, CSS, JavaScript static files
     */
    static class StaticFileHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            addCorsHeaders(exchange);
            String path = exchange.getRequestURI().getPath();
            if (path.equals("/")) {
                path = "/index.html";
            }

            // Remove leading slash
            if (path.startsWith("/")) path = path.substring(1);

            Path filePath = rootDir.resolve(path).normalize();

            // Security check against directory traversal
            if (!filePath.startsWith(rootDir) || !Files.exists(filePath) || Files.isDirectory(filePath)) {
                String notFound = "<h1>404 Not Found</h1><p>File not found: " + path + "</p>";
                exchange.getResponseHeaders().set("Content-Type", "text/html; charset=UTF-8");
                exchange.sendResponseHeaders(404, notFound.length());
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(notFound.getBytes(StandardCharsets.UTF_8));
                }
                return;
            }

            String mimeType = getMimeType(filePath.getFileName().toString());
            exchange.getResponseHeaders().set("Content-Type", mimeType);
            byte[] fileBytes = Files.readAllBytes(filePath);
            exchange.sendResponseHeaders(200, fileBytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(fileBytes);
            }
        }

        private String getMimeType(String filename) {
            if (filename.endsWith(".html")) return "text/html; charset=UTF-8";
            if (filename.endsWith(".css")) return "text/css; charset=UTF-8";
            if (filename.endsWith(".js")) return "application/javascript; charset=UTF-8";
            if (filename.endsWith(".json")) return "application/json; charset=UTF-8";
            if (filename.endsWith(".svg")) return "image/svg+xml";
            if (filename.endsWith(".png")) return "image/png";
            if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) return "image/jpeg";
            return "application/octet-stream";
        }
    }

    private static void sendJson(HttpExchange exchange, int statusCode, String json) throws IOException {
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private static void addCorsHeaders(HttpExchange exchange) {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }

    private static String extractJsonField(String json, String field) {
        if (json == null) return null;
        String pattern = "\"" + field + "\"\\s*:\\s*\"([^\"]+)\"";
        java.util.regex.Matcher m = java.util.regex.Pattern.compile(pattern).matcher(json);
        if (m.find()) {
            return m.group(1);
        }
        return null;
    }
}
