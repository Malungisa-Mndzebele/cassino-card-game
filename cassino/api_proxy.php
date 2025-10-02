<?php
// PHP proxy to forward requests to Python backend on localhost:8000

// Get the request path
$path = isset($_GET['path']) ? $_GET['path'] : '';
if (empty($path)) {
    // Try to extract path from REQUEST_URI
    $request_uri = $_SERVER['REQUEST_URI'];
    $path = preg_replace('#^/cassino/api/#', '', $request_uri);
    // Remove query string if present
    $path = preg_replace('/\?.*$/', '', $path);
}

// Backend URL
$backend_url = 'http://localhost:8000/' . $path;

// Get query string if present
if (!empty($_SERVER['QUERY_STRING'])) {
    // Remove the 'path' parameter we added
    $query = preg_replace('/&?path=[^&]*/', '', $_SERVER['QUERY_STRING']);
    if (!empty($query)) {
        $backend_url .= '?' . $query;
    }
}

// Initialize cURL
$ch = curl_init($backend_url);

// Set cURL options
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, false);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $_SERVER['REQUEST_METHOD']);

// Forward headers
$headers = [];
foreach (getallheaders() as $name => $value) {
    if (strtolower($name) !== 'host') {
        $headers[] = "$name: $value";
    }
}
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

// Forward POST/PUT data
if (in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'PATCH'])) {
    $body = file_get_contents('php://input');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
}

// Execute request
$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$content_type = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);

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

