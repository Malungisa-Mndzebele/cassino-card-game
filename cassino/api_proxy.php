<?php
// PHP proxy to forward requests to Python backend on localhost:8000

// Disable output buffering to see errors
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Get the request path from the URL
$request_uri = $_SERVER['REQUEST_URI'];

// Extract path after /cassino/api/
if (preg_match('#/cassino/api/(.*)#', $request_uri, $matches)) {
    $path = $matches[1];
} else {
    $path = '';
}

// Remove query string from path
$path = preg_replace('/\?.*$/', '', $path);

// Backend URL
$backend_url = 'http://localhost:8000/' . $path;

// Add query string if present
if (!empty($_SERVER['QUERY_STRING'])) {
    $backend_url .= '?' . $_SERVER['QUERY_STRING'];
}

// Initialize cURL
$ch = curl_init($backend_url);

// Set cURL options
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, false);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $_SERVER['REQUEST_METHOD']);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

// Forward headers
$headers = [];
foreach (getallheaders() as $name => $value) {
    $lower_name = strtolower($name);
    if ($lower_name !== 'host' && $lower_name !== 'connection') {
        $headers[] = "$name: $value";
    }
}
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

// Forward POST/PUT/PATCH data
if (in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'PATCH'])) {
    $body = file_get_contents('php://input');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
}

// Execute request
$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$content_type = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);

// Check for cURL errors
if (curl_errno($ch)) {
    $error = curl_error($ch);
    curl_close($ch);
    http_response_code(502);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Backend connection failed', 'message' => $error]);
    exit;
}

curl_close($ch);

// Set response headers
http_response_code($http_code);
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($content_type) {
    header('Content-Type: ' . $content_type);
}

// Output response
echo $response;
?>
