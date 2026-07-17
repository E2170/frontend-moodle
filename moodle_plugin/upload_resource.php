<?php
define("AJAX_SCRIPT", true);
require_once(__DIR__ . "/../../config.php");
require_once($CFG->dirroot . "/webservice/lib.php");
require_once($CFG->dirroot . "/course/lib.php");
require_once($CFG->dirroot . "/mod/resource/lib.php");

$token = required_param("wstoken", PARAM_ALPHANUM);
$courseid = required_param("courseid", PARAM_INT);
$section = required_param("section", PARAM_INT);
$name = required_param("name", PARAM_TEXT);
$description = optional_param("description", "", PARAM_RAW);
$timeopen = optional_param("timeopen", 0, PARAM_INT);
$timeclose = optional_param("timeclose", 0, PARAM_INT);

try {
    $webservicelib = new webservice();
    $webservicelib->authenticate_user($token);

    global $DB, $USER;

    $context = context_course::instance($courseid);
    require_capability("moodle/course:manageactivities", $context);

    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        throw new Exception("Dosya yüklenemedi veya geçersiz.");
    }

    $course = $DB->get_record('course', array('id' => $courseid), '*', MUST_EXIST);
    
    // Create draft area
    $draftitemid = file_get_unused_draft_itemid();
    
    $fileinfo = array(
        'contextid' => context_user::instance($USER->id)->id,
        'component' => 'user',
        'filearea'  => 'draft',
        'itemid'    => $draftitemid,
        'filepath'  => '/',
        'filename'  => $_FILES['file']['name']
    );

    $fs = get_file_storage();
    $fs->create_file_from_pathname($fileinfo, $_FILES['file']['tmp_name']);

    $module = $DB->get_record('modules', array('name' => 'resource'), '*', MUST_EXIST);
    course_create_sections_if_missing($course, array($section));
    $modinfo = get_fast_modinfo($course);
    $cw = $modinfo->get_section_info($section);

    $cm = new stdClass();
    $cm->course = $course->id;
    $cm->module = $module->id;
    $cm->section = $cw->section;
    $cm->idnumber = '';
    $cm->added = time();
    $cm->score = 0;
    $cm->indent = 0;
    $cm->visible = 1;
    $cm->visibleold = 1;
    $cm->groupmode = 0;
    $cm->groupingid = 0;
    
    if ($timeopen > 0 || $timeclose > 0) {
        $availability = array('op' => '&', 'c' => array(), 'showc' => array());
        if ($timeopen > 0) {
            $availability['c'][] = array('type' => 'date', 'd' => '>=', 't' => $timeopen);
            $availability['showc'][] = true;
        }
        if ($timeclose > 0) {
            $availability['c'][] = array('type' => 'date', 'd' => '<', 't' => $timeclose);
            $availability['showc'][] = true;
        }
        $cm->availability = json_encode($availability);
    }
    
    $cmid = add_course_module($cm);

    $instance = new stdClass();
    $instance->course = $course->id;
    $instance->name = $name;
    $instance->intro = $description;
    $instance->introformat = FORMAT_HTML;
    $instance->coursemodule = $cmid;
    $instance->section = $section;
    $instance->visible = 1;
    
    // Resource modülü ayarları
    $instance->tobemigrated = 0;
    $instance->legacyfiles = 0;
    $instance->legacyfileslast = null;
    $instance->display = 0; // AUTO
    $instance->displayoptions = '';
    $instance->filterfiles = 0;
    $instance->revision = 1;
    $instance->timemodified = time();
    $instance->files = $draftitemid;

    $instance->id = resource_add_instance($instance, null);
    $DB->set_field('course_modules', 'instance', $instance->id, array('id' => $cmid));
    course_add_cm_to_section($course, $cmid, $section);
    
    $cm = get_coursemodule_from_id('resource', $cmid, $course->id, false, MUST_EXIST);
    \core\event\course_module_created::create_from_cm($cm, $context)->trigger();
    
    rebuild_course_cache($course->id, true);

    echo json_encode(["status" => true, "message" => "Dosya başarıyla yüklendi", "cmid" => $cmid]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(["status" => false, "message" => $e->getMessage()]);
}
