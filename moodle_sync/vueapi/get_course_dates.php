<?php
require_once("../../config.php");
$token = required_param("token", PARAM_ALPHANUM);
$courseid = required_param("courseid", PARAM_INT);

global $DB;
$tokenobj = $DB->get_record("external_tokens", ["token" => $token]);
if (!$tokenobj) {
    echo json_encode([]);
    die();
}

$sql = "
    SELECT cm.id, b.closingtime as timeclose 
    FROM {course_modules} cm 
    JOIN {bigbluebuttonbn} b ON b.id = cm.instance 
    JOIN {modules} m ON m.id = cm.module 
    WHERE m.name = 'bigbluebuttonbn' AND cm.course = ? AND b.closingtime > 0
    
    UNION
    
    SELECT cm.id, a.duedate as timeclose 
    FROM {course_modules} cm 
    JOIN {assign} a ON a.id = cm.instance 
    JOIN {modules} m ON m.id = cm.module 
    WHERE m.name = 'assign' AND cm.course = ? AND a.duedate > 0
    
    UNION
    
    SELECT cm.id, q.timeclose as timeclose 
    FROM {course_modules} cm 
    JOIN {quiz} q ON q.id = cm.instance 
    JOIN {modules} m ON m.id = cm.module 
    WHERE m.name = 'quiz' AND cm.course = ? AND q.timeclose > 0
";

$records = $DB->get_records_sql($sql, [$courseid, $courseid, $courseid]);
$dates = [];
foreach ($records as $rec) {
    $dates[$rec->id] = $rec->timeclose;
}

header("Content-Type: application/json");
echo json_encode($dates);
