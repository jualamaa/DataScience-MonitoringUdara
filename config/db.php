<?php
// config/db.php
mysqli_report(MYSQLI_REPORT_OFF); // tampilkan error sebagai pesan JSON, bukan fatal error kosong

$host     = "sql305.infinityfree.com";   // cek di panel: MySQL Hostname
$username = "if0_43090480";              // cek di panel: MySQL Username
$password = "mtsn1klaten2024";   // password akun hosting / MySQL
$dbname   = "if0_43090480_theravo_db";   // nama database LENGKAP dengan prefix

$conn = new mysqli($host, $username, $password, $dbname);

if ($conn->connect_error) {
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Koneksi database gagal: " . $conn->connect_error
    ]);
    exit();
}

$conn->set_charset("utf8mb4");
$conn->query("SET time_zone = '+07:00'");
?>