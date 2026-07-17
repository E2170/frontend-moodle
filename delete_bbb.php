<?php
define('CLI_SCRIPT', true);
require('/var/www/moodle/config.php');
global $DB;
$instance = $DB->get_record('bigbluebuttonbn', ['name' => 'Test BBB']);
if ($instance) {
    require_once($CFG->dirroot.'/course/lib.php');
    $cm = get_coursemodule_from_instance('bigbluebuttonbn', $instance->id);
    if ($cm) {
        course_delete_module($cm->id);
        echo "Deleted module\n";
    } else {
        $DB->delete_records('bigbluebuttonbn', ['id' => $instance->id]);
        echo "Deleted record only\n";
    }
} else {
    echo "Not found\n";
}
