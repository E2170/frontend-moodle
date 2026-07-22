<?php
/**
 * Direct BBB Join via Token
 * This script logs the user in using their web service token and directly redirects them
 * to the BigBlueButton join URL, bypassing the Moodle intermediate screen and avoiding IP mismatch issues.
 */

require_once('../../config.php');
require_once($CFG->dirroot . '/webservice/lib.php');

$token = required_param('token', PARAM_ALPHANUM);
$cmid = required_param('cmid', PARAM_INT);

global $DB, $USER, $PAGE;

$PAGE->set_url('/local/vueapi/login_and_join.php');
$PAGE->set_context(context_system::instance());

$tokenobj = $DB->get_record('external_tokens', array('token' => $token));
if (!$tokenobj) {
    print_error('invalidtoken');
}

$user = $DB->get_record('user', array('id' => $tokenobj->userid, 'deleted' => 0, 'suspended' => 0));
if (!$user) {
    print_error('invaliduser');
}

// Log the user in natively
complete_user_login($user);

// Redirect directly to the BBB session join endpoint with the required sesskey
$joinurl = new moodle_url('/mod/bigbluebuttonbn/bbb_view.php', array(
    'action'  => 'join',
    'id'      => $cmid,
    'sesskey' => sesskey()
));
redirect($joinurl);
