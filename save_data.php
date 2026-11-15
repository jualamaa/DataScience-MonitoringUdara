<?php
// save_data.php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");

require_once __DIR__ . '/config/db.php';

$suhu       = isset($_GET['suhu']) ? floatval($_GET['suhu']) : null;
$kelembapan = isset($_GET['kelembapan']) ? floatval($_GET['kelembapan']) : null;
$co2        = isset($_GET['co2']) ? floatval($_GET['co2']) : null;
$kipas      = (isset($_GET['kipas']) && $_GET['kipas'] == '1') ? 1 : 0;

if ($suhu !== null && $kelembapan !== null && $co2 !== null) {
    // 1. Simpan log sensor ke tabel sensor_logs biasa
    $stmt = $conn->prepare("INSERT INTO sensor_logs (co2, temperature, humidity, kipas) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("dddi", $co2, $suhu, $kelembapan, $kipas);

    if ($stmt->execute()) {
        $stmt->close();

        // 2. Pertahankan 50 data terbaru
        $conn->query("DELETE FROM sensor_logs WHERE id NOT IN (SELECT id FROM (SELECT id FROM sensor_logs ORDER BY id DESC LIMIT 50) as temp)");

        // 3. Baca status kontrol manual/auto dari file JSON
        $fileStatus = __DIR__ . '/fan_status.json';
        $modeControl = 'auto';
        $fanStatusControl = 0;

        if (file_exists($fileStatus)) {
            $parsed = json_decode(file_get_contents($fileStatus), true);
            if ($parsed) {
                $modeControl = $parsed['mode'];
                $fanStatusControl = intval($parsed['status']);
            }
        }

        http_response_code(200);
        echo json_encode([
            "status"  => "success",
            "message" => "Data berhasil disimpan",
            "mode"    => $modeControl,
            "fan"     => $fanStatusControl
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Gagal menyimpan log"]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Parameter tidak lengkap"]);
}

$conn->close();
?>