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

// Set JSON response header
header('Content-Type: application/json');

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

// Log request details (for debugging)
error_log("Request to: " . $python_url);
error_log("Method: " . $method);
error_log("Body: " . $body);

// Initialize cURL
$ch = curl_init($python_url);

// Set common cURL options
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

// Set headers
$headers = ['Content-Type: application/json'];
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

// Handle request body for POST/PUT
if ($method === 'POST' || $method === 'PUT') {
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
}

// Execute request
$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);

// Check for cURL errors
if (curl_errno($ch)) {
    error_log("cURL Error: " . curl_error($ch));
    http_response_code(500);
    echo json_encode(['error' => 'Failed to connect to backend service']);
    curl_close($ch);
    exit();
}

curl_close($ch);

// Log response (for debugging)
error_log("Response Code: " . $http_code);
error_log("Response Body: " . $response);

// Return response with same status code
http_response_code($http_code);
echo $response;