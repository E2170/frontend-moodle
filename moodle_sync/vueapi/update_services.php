<?php
define('CLI_SCRIPT', true);
require('/var/www/moodle/config.php');
require_once("$CFG->dirroot/lib/externallib.php");
require_once("$CFG->dirroot/webservice/lib.php");

echo "Updating external descriptions...\\n";
external_update_descriptions('local_vueapi');
echo "Services updated successfully.\\n";
