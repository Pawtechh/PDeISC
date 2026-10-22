<?php
// ==========================================================
// Archivo de Login PHP alternativo para XAMPP
// Copiar a: C:\xampp\htdocs\api\login.php
// Endpoint: http://192.168.100.63/api/login.php
// ==========================================================

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Método no permitido. Utilizar POST."]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);
$email = isset($data['email']) ? trim($data['email']) : '';
$password = isset($data['password']) ? trim($data['password']) : '';

if (empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Email y contraseña son obligatorios."]);
    exit();
}

$host = 'localhost';
$db   = 'db_usuarios';
$user = 'root';
$pass = '';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
    
    $stmt = $pdo->prepare("SELECT id, nombre, email, password, rol FROM usuarios WHERE LOWER(email) = LOWER(?)");
    $stmt->execute([$email]);
    $userRow = $stmt->fetch();

    if ($userRow && $userRow['password'] === $password) {
        http_response_code(200);
        echo json_encode([
            "success" => true,
            "message" => "¡Bienvenido/a de nuevo, " . $userRow['nombre'] . "!",
            "source" => "mysql_php",
            "user" => [
                "id" => $userRow['id'],
                "nombre" => $userRow['nombre'],
                "email" => $userRow['email'],
                "rol" => $userRow['rol'],
                "horaIngreso" => date('H:i:s')
            ]
        ]);
    } else {
        http_response_code(401);
        echo json_encode([
            "success" => false,
            "message" => "Usuario o contraseña incorrectos."
        ]);
    }
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error de conexión con la base de datos: " . $e->getMessage()
    ]);
}
?>
