<?php
$functions = [
    // This is a placeholder for services. Since the external.php is quite large,
    // we would normally define all the external functions here.
    'local_vueapi_get_questions' => [
        'classname' => 'local_vueapi\external',
        'methodname' => 'get_questions',
        'classpath' => 'local/vueapi/external.php',
        'description' => 'Get questions',
        'type' => 'read',
        'ajax' => true,
        'services' => [MOODLE_OFFICIAL_MOBILE_SERVICE]
    ]
];

$services = [
    'vueapi_service' => [
        'functions' => ['local_vueapi_get_questions'],
        'requiredcapability' => '',
        'restrictedusers' => 0,
        'enabled' => 1,
        'shortname' => 'vueapi'
    ]
];
