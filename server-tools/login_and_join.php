<?php
/**
 * Direct BBB Join/Play via Token
 * This script logs the user in using their web service token and directly redirects them
 * to the BigBlueButton join or play URL.
 */

require_once('../../config.php');
require_once($CFG->dirroot . '/webservice/lib.php');

$token = required_param('token', PARAM_ALPHANUM);
$cmid = optional_param('cmid', 0, PARAM_INT);
$action = optional_param('action', 'join', PARAM_ALPHA);
$rid = optional_param('rid', '', PARAM_ALPHANUMEXT);
$bn = optional_param('bn', 0, PARAM_INT);

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

// Bypass Moodle's bbb_view.php for playback if activity is hidden
if ($action === 'play' && !empty($rid)) {
    $recording = $DB->get_record('bigbluebuttonbn_recordings', array('id' => $rid));
    if ($recording) {
        // Construct the Scalelite playback URL directly using the server_url config
        $server_url = $DB->get_field('config_plugins', 'value', array('plugin' => 'bigbluebuttonbn', 'name' => 'server_url'));
        // server_url is usually https://domain/bigbluebutton/api/
        // Playback URL is https://domain/playback/presentation/2.3/<recordingid>
        $base = preg_replace('#/bigbluebutton/api/?$#', '', $server_url);
        
        $playback_url = $base . '/playback/presentation/2.3/' . $recording->recordingid;
        redirect(new moodle_url($playback_url));
    } else {
        print_error('invalidrecord');
    }
} else {
    $url = new moodle_url('/mod/bigbluebuttonbn/bbb_view.php', array(
        'action'  => 'join',
        'id'      => $cmid,
        'sesskey' => sesskey()
    ));
    redirect($url);
}
