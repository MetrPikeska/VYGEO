<?php
// Photo upload API for VYGEO OPALENA
header('Content-Type: application/json; charset=utf-8');
date_default_timezone_set('Europe/Prague');

// Security headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Database configuration
$db_host = "md397.wedos.net";
$db_user = "w383750_vygeo";
$db_pass = "7JAWfDdh";
$db_name = "d383750_vygeo";

try {
    $pdo = new PDO(
        "mysql:host=$db_host;dbname=$db_name;charset=utf8mb4",
        $db_user,
        $db_pass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? null;

// GET: List photos for a feature
if ($method === 'GET' && $action === 'list') {
    $feature_id = $_GET['feature_id'] ?? null;
    
    if (!$feature_id || !is_numeric($feature_id)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Invalid feature_id']);
        exit;
    }
    
    try {
        // Verify feature exists
        $stmt = $pdo->prepare("SELECT id FROM map_features WHERE id = ?");
        $stmt->execute([$feature_id]);
        if (!$stmt->fetch()) {
            http_response_code(404);
            echo json_encode(['ok' => false, 'error' => 'Feature not found']);
            exit;
        }
        
        // Get photos for feature
        $stmt = $pdo->prepare("
            SELECT id, photo_data, created_at 
            FROM feature_photos 
            WHERE feature_id = ? 
            ORDER BY created_at DESC
        ");
        $stmt->execute([$feature_id]);
        $photos = $stmt->fetchAll();
        
        // Debug: log number of photos found
        error_log("Found " . count($photos) . " photos for feature $feature_id");
        
        // Return photos with compressed data for large images
        $photos_processed = [];
        foreach ($photos as $photo) {
            $photo_data = $photo['photo_data'];
            
            // If photo is too large for JSON, compress it
            if (strlen($photo_data) > 200000) { // 200KB limit
                // Try to compress the image
                $compressed_data = compressBase64Image($photo_data);
                if ($compressed_data) {
                    $photo_data = $compressed_data;
                } else {
                    // If compression fails, use placeholder
                    $photo_data = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';
                }
            }
            
            $photos_processed[] = [
                'id' => $photo['id'],
                'photo_data' => $photo_data,
                'created_at' => $photo['created_at']
            ];
        }
        
        echo json_encode([
            'ok' => true,
            'photos' => $photos_processed
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'Database error: ' . $e->getMessage()]);
    }
}

// POST: Upload new photo
elseif ($method === 'POST') {
    $feature_id = $_POST['feature_id'] ?? null;
    $photo_data = $_POST['photo'] ?? null;
    
    // Validate input
    if (!$feature_id || !is_numeric($feature_id)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Invalid feature_id']);
        exit;
    }
    
    if (!$photo_data) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'No photo data provided']);
        exit;
    }
    
    // Validate base64 data
    if (!preg_match('/^data:image\/(jpeg|jpg|png|gif|webp);base64,/', $photo_data, $matches)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Invalid image format. Only JPEG, PNG, GIF, and WebP are allowed.']);
        exit;
    }
    
    $image_type = $matches[1];
    $base64_data = substr($photo_data, strpos($photo_data, ',') + 1);
    $decoded_data = base64_decode($base64_data);
    
    // Check file size (2MB limit for better JSON handling)
    if (strlen($decoded_data) > 2 * 1024 * 1024) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Image too large. Maximum size is 2MB.']);
        exit;
    }
    
    // Validate image data
    $image_info = getimagesizefromstring($decoded_data);
    if ($image_info === false) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Invalid image data']);
        exit;
    }
    
    // Check dimensions (optional - prevent extremely large images)
    if ($image_info[0] > 4000 || $image_info[1] > 4000) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Image dimensions too large. Maximum 4000x4000 pixels.']);
        exit;
    }
    
    try {
        // Verify feature exists
        $stmt = $pdo->prepare("SELECT id FROM map_features WHERE id = ?");
        $stmt->execute([$feature_id]);
        if (!$stmt->fetch()) {
            http_response_code(404);
            echo json_encode(['ok' => false, 'error' => 'Feature not found']);
            exit;
        }
        
        // Insert photo
        $stmt = $pdo->prepare("
            INSERT INTO feature_photos (feature_id, photo_data) 
            VALUES (?, ?)
        ");
        $stmt->execute([$feature_id, $photo_data]);
        
        $photo_id = $pdo->lastInsertId();
        
        echo json_encode([
            'ok' => true,
            'photo_id' => $photo_id,
            'message' => 'Photo uploaded successfully'
        ]);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'Database error: ' . $e->getMessage()]);
    }
}

// DELETE: Remove photo
elseif ($method === 'DELETE' && $action === 'delete') {
    $photo_id = $_GET['photo_id'] ?? null;
    
    if (!$photo_id || !is_numeric($photo_id)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Invalid photo_id']);
        exit;
    }
    
    try {
        $stmt = $pdo->prepare("DELETE FROM feature_photos WHERE id = ?");
        $stmt->execute([$photo_id]);
        
        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['ok' => false, 'error' => 'Photo not found']);
            exit;
        }
        
        echo json_encode([
            'ok' => true,
            'message' => 'Photo deleted successfully'
        ]);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'Database error: ' . $e->getMessage()]);
    }
}

else {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
}

// Function to compress base64 image
function compressBase64Image($base64_data, $quality = 60) {
    try {
        // Extract image data from base64
        $data = substr($base64_data, strpos($base64_data, ',') + 1);
        $image_data = base64_decode($data);
        
        // Create image resource
        $image = imagecreatefromstring($image_data);
        if (!$image) return false;
        
        // Get original dimensions
        $width = imagesx($image);
        $height = imagesy($image);
        
        // Calculate new dimensions (max 800px)
        $max_size = 800;
        if ($width > $height) {
            $new_width = $max_size;
            $new_height = ($height * $max_size) / $width;
        } else {
            $new_height = $max_size;
            $new_width = ($width * $max_size) / $height;
        }
        
        // Create new image
        $new_image = imagecreatetruecolor($new_width, $new_height);
        imagecopyresampled($new_image, $image, 0, 0, 0, 0, $new_width, $new_height, $width, $height);
        
        // Output to buffer
        ob_start();
        imagejpeg($new_image, null, $quality);
        $compressed_data = ob_get_contents();
        ob_end_clean();
        
        // Clean up
        imagedestroy($image);
        imagedestroy($new_image);
        
        // Return as base64
        return 'data:image/jpeg;base64,' . base64_encode($compressed_data);
        
    } catch (Exception $e) {
        error_log('Image compression error: ' . $e->getMessage());
        return false;
    }
}
?>
