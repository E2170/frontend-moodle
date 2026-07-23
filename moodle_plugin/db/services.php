<?php
$functions = [
    'local_vueapi_get_questions' => [
        'classname' => 'local_vueapi\external',
        'methodname' => 'get_questions',
        'classpath' => 'local/vueapi/external.php',
        'description' => 'Get questions',
        'type' => 'read',
        'ajax' => true,
        'services' => [MOODLE_OFFICIAL_MOBILE_SERVICE]
    ],
    'local_vueapi_add_activity' => [
        'classname' => 'local_vueapi\external',
        'methodname' => 'add_activity',
        'classpath' => 'local/vueapi/external.php',
        'description' => 'Add activity',
        'type' => 'write',
        'ajax' => true,
        'services' => [MOODLE_OFFICIAL_MOBILE_SERVICE]
    ],
    'local_vueapi_get_choice_results' => [
        'classname'   => 'local_vueapi\external',
        'methodname'  => 'get_choice_results',
        'classpath'   => 'local/vueapi/external.php',
        'description' => 'Get choice activity results for teachers',
        'type'        => 'read',
        'ajax'        => true,
        'services'    => [MOODLE_OFFICIAL_MOBILE_SERVICE]
    ],
    'local_vueapi_delete_activity' => [
        'classname' => 'local_vueapi\external',
        'methodname' => 'delete_activity',
        'classpath' => 'local/vueapi/external.php',
        'description' => 'Delete activity',
        'type' => 'write',
        'ajax' => true,
        'services' => [MOODLE_OFFICIAL_MOBILE_SERVICE]
    ],
    'local_vueapi_get_question_categories' => [
        'classname' => 'local_vueapi\external',
        'methodname' => 'get_question_categories',
        'classpath' => 'local/vueapi/external.php',
        'description' => 'Get question categories',
        'type' => 'read',
        'ajax' => true,
        'services' => [MOODLE_OFFICIAL_MOBILE_SERVICE]
    ],
    'local_vueapi_add_quiz_question' => [
        'classname' => 'local_vueapi\external',
        'methodname' => 'add_quiz_question',
        'classpath' => 'local/vueapi/external.php',
        'description' => 'Add quiz question',
        'type' => 'write',
        'ajax' => true,
        'services' => [MOODLE_OFFICIAL_MOBILE_SERVICE]
    ],
    'local_vueapi_add_quiz_override' => [
        'classname' => 'local_vueapi\external',
        'methodname' => 'add_quiz_override',
        'classpath' => 'local/vueapi/external.php',
        'description' => 'Add quiz override',
        'type' => 'write',
        'ajax' => true,
        'services' => [MOODLE_OFFICIAL_MOBILE_SERVICE]
    ],
    'local_vueapi_set_coursemodule_visible' => [
        'classname' => 'local_vueapi\external',
        'methodname' => 'set_coursemodule_visible',
        'classpath' => 'local/vueapi/external.php',
        'description' => 'Set coursemodule visible',
        'type' => 'write',
        'ajax' => true,
        'services' => [MOODLE_OFFICIAL_MOBILE_SERVICE]
    ],
    'local_vueapi_get_quiz_slots' => [
        'classname' => 'local_vueapi\external',
        'methodname' => 'get_quiz_slots',
        'classpath' => 'local/vueapi/external.php',
        'description' => 'Get quiz slots',
        'type' => 'read',
        'ajax' => true,
        'services' => [MOODLE_OFFICIAL_MOBILE_SERVICE]
    ],
    'local_vueapi_delete_question' => [
        'classname' => 'local_vueapi\external',
        'methodname' => 'delete_question',
        'classpath' => 'local/vueapi/external.php',
        'description' => 'Delete question',
        'type' => 'write',
        'ajax' => true,
        'services' => [MOODLE_OFFICIAL_MOBILE_SERVICE]
    ]
];

$services = [
    'vueapi_service' => [
        'functions' => [
            'local_vueapi_get_questions',
            'local_vueapi_add_activity',
            'local_vueapi_delete_activity',
            'local_vueapi_get_question_categories',
            'local_vueapi_add_quiz_question',
            'local_vueapi_add_quiz_override',
            'local_vueapi_set_coursemodule_visible',
            'local_vueapi_get_quiz_slots',
            'local_vueapi_delete_question',
            'mod_forum_get_forum_discussions',
            'mod_forum_get_discussion_posts',
            'mod_forum_add_discussion',
            'mod_forum_add_discussion_post'
        ],
        'requiredcapability' => '',
        'restrictedusers' => 0,
        'enabled' => 1,
        'shortname' => 'vueapi',
        'downloadfiles' => 1
    ]
];
