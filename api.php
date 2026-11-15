<?php
// api.php
error_reporting(0);
ini_set('display_errors', 0);

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/config/db.php';

$fileStatus = __DIR__ . '/fan_status.json';

// 0. Jika ada klik sakelar dari Web (POST Request) -> Simpan ke File JSON
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input  = json_decode(file_get_contents('php://input'), true);
    $mode   = isset($input['mode']) ? $input['mode'] : 'auto';
    $status = isset($input['status']) ? intval($input['status']) : 0;

    $dataControl = ["mode" => $mode, "status" => $status];
    file_put_contents($fileStatus, json_encode($dataControl));

    echo json_encode(["status" => "success", "message" => "Status kipas disimpan ke file"]);
    exit();
}

// 1. Baca Status Kontrol Kipas dari File JSON
$controlData = ["mode" => "auto", "status" => 0];
if (file_exists($fileStatus)) {
    $jsonContent = file_get_contents($fileStatus);
    $parsed = json_decode($jsonContent, true);
    if ($parsed) $controlData = $parsed;
}

// 2. Ambil Data Sensor Terbaru
$queryLatest = "SELECT id, co2, temperature, humidity, kipas, TIMESTAMPDIFF(SECOND, created_at, NOW()) AS umur_detik, DATE_FORMAT(created_at, '%d/%m/%Y') as tanggal, DATE_FORMAT(created_at, '%H:%i:%s') as waktu FROM sensor_logs ORDER BY id DESC LIMIT 1";
$resultLatest = $conn->query($queryLatest);
$latestData = ($resultLatest && $resultLatest->num_rows > 0) ? $resultLatest->fetch_assoc() : null;

// 3. Ambil 25 Data Riwayat
$queryHistory = "SELECT id, co2, temperature, humidity, kipas, DATE_FORMAT(created_at, '%d/%m/%Y') as tanggal, DATE_FORMAT(created_at, '%H:%i:%s') as waktu FROM sensor_logs ORDER BY id DESC LIMIT 25";
$resultHistory = $conn->query($queryHistory);
$historyData = [];
if ($resultHistory) {
    while ($row = $resultHistory->fetch_assoc()) {
        $historyData[] = $row;
    }
}

// 4. Kirim Response JSON
echo json_encode([
    "status"  => "success",
    "current" => $latestData,
    "control" => $controlData,
    "history" => $historyData
]);

$conn->close();
?>