<?php
define("CLI_SCRIPT", true);
require("/var/www/moodle/config.php");
global $DB;
$service = $DB->get_record('external_services', ['shortname' => 'akuzem_react']);
if (!$service) die("No service\n");
$t = new stdClass();
$t->token = 'dummytoken1234';
$t->tokentype = 0;
$t->userid = 30; // test.ogrenci30
$t->externalserviceid = $service->id;
$t->contextid = 0;
$t->creatorid = 2;
$t->timecreated = time();
$t->validuntil = 0;
try {
  $DB->insert_record('external_tokens', $t);
  echo "Inserted token dummytoken1234\n";
} catch(Exception $e) {
  echo $e->getMessage();
}
