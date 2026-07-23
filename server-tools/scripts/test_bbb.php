<?php
define('CLI_SCRIPT', true);
require('/var/www/moodle/config.php');
require_once($CFG->dirroot.'/mod/bigbluebuttonbn/lib.php');
$instance = new stdClass();
$instance->course = 2; // whatever
$instance->name = 'Test BBB';
$instance->intro = 'Intro';
$instance->introformat = FORMAT_HTML;
try {
    bigbluebuttonbn_add_instance($instance);
    echo "SUCCESS\n";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
