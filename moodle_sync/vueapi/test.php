<?php
require_once('../config.php');
global $DB;
$funcs = $DB->get_records('external_functions', array('component' => 'mod_bigbluebuttonbn'));
foreach ($funcs as $f) {
    echo $f->name . "\n";
}
