<?php
// Set headers for JSON response
header('Content-Type: application/json');

// Get the request URI and method
$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);

// Remove /cassino/api prefix
$path = preg_replace('/^\/cassino\/api/', '', $path);

// Forward to Python backend
$python_url = "http://localhost:8000" . $path;
$method = $_SERVER['REQUEST_METHOD'];
$body = file_get_contents('php://input');

// Initialize cURL
$ch = curl_init($python_url);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

// Handle POST/PUT requests
if ($method === 'POST' || $method === 'PUT') {
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        'Content-Type: application/json',
        'Content-Length: ' . strlen($body)
    ));
}

// Execute request
$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// Return response with same status code
http_response_code($http_code);
echo $response;