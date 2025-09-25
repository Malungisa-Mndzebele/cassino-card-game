<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('HTTP/1.1 200 OK');
    exit();
}

// Get the request URI and method
$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);

// Remove /cassino/api prefix
$path = preg_replace('/^\/cassino\/api/', '', $path);

// Forward to Python backend
$python_url = "http://localhost:8000" . $path;
$method = $_SERVER['REQUEST_METHOD'];

// Get request body for POST/PUT requests
$body = file_get_contents('php://input');

// Log request details
error_log(sprintf(
    "Request: %s %s\nBody: %s",
    $method,
    $python_url,
    $body
));

// Initialize cURL
$ch = curl_init($python_url);

// Set cURL options
curl_setopt_array($ch, [
    CURLOPT_CUSTOMREQUEST => $method,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Accept: application/json'
    ]
]);

// Handle request body for POST/PUT
if ($method === 'POST' || $method === 'PUT') {
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
}

// Execute request
$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$content_type = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);

// Log response details
error_log(sprintf(
    "Response: %d\nContent-Type: %s\nBody: %s",
    $http_code,
    $content_type,
    $response
));

// Check for cURL errors
if (curl_errno($ch)) {
    error_log("cURL Error: " . curl_error($ch));
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'error' => 'Failed to connect to backend service',
        'details' => curl_error($ch)
    ]);
    curl_close($ch);
    exit();
}

curl_close($ch);

// Ensure we have a valid JSON response
if ($response === false || empty($response)) {
    error_log("Empty response from backend");
    http_response_code(502);
    header('Content-Type: application/json');
    echo json_encode([
        'error' => 'Empty response from backend service'
    ]);
    exit();
}

// Try to decode the response to validate JSON
$decoded = json_decode($response);
if (json_last_error() !== JSON_ERROR_NONE) {
    error_log("Invalid JSON response: " . json_last_error_msg());
    error_log("Raw response: " . $response);
    http_response_code(502);
    header('Content-Type: application/json');
    echo json_encode([
        'error' => 'Invalid JSON response from backend service',
        'details' => json_last_error_msg()
    ]);
    exit();
}

// Set response headers
http_response_code($http_code);
header('Content-Type: application/json');

// Send response
echo $response;