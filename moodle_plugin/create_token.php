<?php
define("CLI_SCRIPT", true);
require("/var/www/moodle/config.php");
global $DB;
$service = $DB->get_record('external_services', ['shortname' => 'akuzem_react']);
$t = new stdClass();
$t->token = 'teststudenttoken';
$t->tokentype = 0;
$t->userid = 30;
$t->externalserviceid = $service->id;
$t->contextid = 1;
$t->creatorid = 30;
$t->timecreated = time();
$DB->insert_record('external_tokens', $t);
echo "Token created\n";
