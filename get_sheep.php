<?php
header('Content-Type: application/json; charset=utf-8');
date_default_timezone_set('Europe/Prague');

$db_host = "md397.wedos.net";
$db_user = "w383750_opalena";
$db_pass = "65r9P7XW";
$db_name = "d383750_opalena";

$mysqli = new mysqli($db_host, $db_user, $db_pass, $db_name);
if ($mysqli->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => 'DB connect fail']);
    exit;
}

if (isset($_GET['history'])) {
    // posledních 500 záznamů
    $sql = "SELECT `timestamp`, `count` FROM sheep_log ORDER BY id DESC LIMIT 500";
    $result = $mysqli->query($sql);
    $rows = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $rows[] = $row;
        }
    } else {
        echo json_encode(['error' => $mysqli->error]);
        exit;
    }
    echo json_encode(array_reverse($rows), JSON_UNESCAPED_UNICODE);
} else {
    $sql = "SELECT `timestamp`, `count` FROM sheep_log ORDER BY id DESC LIMIT 1";
    $result = $mysqli->query($sql);
    $row = $result ? $result->fetch_assoc() : null;
    echo json_encode($row ?? ['count'=>0,'timestamp'=>null], JSON_UNESCAPED_UNICODE);
}

$mysqli->close();
