<?php
define('CLI_SCRIPT', true);
require('/var/www/moodle/config.php');
global $DB;

$funcs = [
    'local_vueapi_get_question_categories',
    'local_vueapi_get_questions',
    'local_vueapi_add_quiz_question',
    'local_vueapi_add_quiz_override',
    'local_vueapi_set_coursemodule_visible'
];

$services = $DB->get_records('external_services');
foreach ($services as $service) {
    echo "Adding to service: {$service->name} (id: {$service->id})\\n";
    foreach ($funcs as $func) {
        if (!$DB->record_exists('external_services_functions', ['externalserviceid' => $service->id, 'functionname' => $func])) {
            $record = new stdClass();
            $record->externalserviceid = $service->id;
            $record->functionname = $func;
            $DB->insert_record('external_services_functions', $record);
            echo " Added $func\\n";
        }
    }
}
require_once("$CFG->dirroot/webservice/lib.php");
external_update_descriptions('local_vueapi');
echo "Done.\\n";
