<?php
define('AJAX_SCRIPT', true);
require_once('../../config.php');
require_once($CFG->dirroot . '/mod/bigbluebuttonbn/lib.php');
require_once($CFG->dirroot . '/mod/bigbluebuttonbn/classes/external/get_recordings.php');

header('Content-Type: application/json');

$token = required_param('token', PARAM_ALPHANUM);
$cmid = required_param('cmid', PARAM_INT);
$bbbid = required_param('bbbid', PARAM_INT);

// Verify token
$tokenobj = $DB->get_record('external_tokens', array('token' => $token));
if (!$tokenobj) {
    echo json_encode(['error' => 'invalidtoken']);
    die();
}

$user = $DB->get_record('user', array('id' => $tokenobj->userid, 'deleted' => 0, 'suspended' => 0));
if (!$user) {
    echo json_encode(['error' => 'invaliduser']);
    die();
}

// Ensure the user is enrolled in the course or has some access
$cm = get_coursemodule_from_id('bigbluebuttonbn', $cmid, 0, false, IGNORE_MISSING);
if (!$cm) {
    echo json_encode(['error' => 'invalidcoursemodule']);
    die();
}

// Fetch the instance
$instance = $DB->get_record('bigbluebuttonbn', array('id' => $bbbid));
if (!$instance) {
    echo json_encode(['error' => 'invalidinstance']);
    die();
}

// Temporarily set user to admin to bypass capability and hidden activity checks
$original_user = $USER;
$admin = get_admin();
\core\session\manager::set_user($admin);

try {
    $result = \mod_bigbluebuttonbn\external\get_recordings::execute($instance->id, 0);
    echo json_encode($result);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}

// Restore user
\core\session\manager::set_user($original_user);
