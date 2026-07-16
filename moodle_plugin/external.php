<?php
namespace local_vueapi;

defined('MOODLE_INTERNAL') || die();

global $CFG;
require_once($CFG->dirroot . '/course/lib.php');

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_value;
use core_external\external_single_structure;

class external extends external_api {

    // --- AKTIVITE EKLEME FONKSIYONLARI ---
    
    private static function get_default_quiz_instance_fields() {
        return array(
            'timeopen' => 0,
            'timeclose' => 0,
            'timelimit' => 0,
            'overduehandling' => 'autosubmit',
            'graceperiod' => 86400,
            'attempts' => 0,
            'attemptonlast' => 0,
            'grademethod' => 1,
            'decimalpoints' => 2,
            'questiondecimalpoints' => -1,
            'reviewattempt' => 69904,
            'reviewcorrectness' => 69904,
            'reviewmarks' => 69904,
            'reviewspecificfeedback' => 69904,
            'reviewgeneralfeedback' => 69904,
            'reviewrightanswer' => 69904,
            'reviewoverallfeedback' => 69904,
            'questionsperpage' => 1,
            'navmethod' => 'free',
            'shuffleanswers' => 1,
            'sumgrades' => 0,
            'grade' => 10,
            'browsersecurity' => '-',
            'quizpassword' => '',
            'subnet' => '',
            'delay1' => 0,
            'delay2' => 0,
            'showuserpicture' => 0,
            'showblocks' => 0,
            'completionattemptsexhausted' => 0,
            'completionminattempts' => 0,
            'allowofflineattempts' => 0,
            'preferredbehaviour' => 'deferredfeedback',
            'canredoquestions' => 0,
        );
    }

    public static function add_activity_parameters() {
        return new external_function_parameters(
            array(
                'courseid' => new external_value(PARAM_INT, 'Ders ID', VALUE_REQUIRED),
                'section' => new external_value(PARAM_INT, 'Hafta Numarasi', VALUE_REQUIRED),
                'type' => new external_value(PARAM_ALPHANUMEXT, 'Aktivite Tipi', VALUE_REQUIRED),
                'name' => new external_value(PARAM_TEXT, 'Aktivite Adi', VALUE_REQUIRED),
                'description' => new external_value(PARAM_RAW, 'Aciklama', VALUE_DEFAULT, ''),
                'duedate' => new external_value(PARAM_INT, 'Bitis Tarihi', VALUE_DEFAULT, 0),
                'timeopen' => new external_value(PARAM_INT, 'Sinav Baslangic', VALUE_DEFAULT, 0),
                'timeclose' => new external_value(PARAM_INT, 'Sinav Bitis', VALUE_DEFAULT, 0),
                'maxbytes' => new external_value(PARAM_INT, 'Maksimum Dosya Boyutu', VALUE_DEFAULT, 0),
                'maxfiles' => new external_value(PARAM_INT, 'Maksimum Dosya Sayisi', VALUE_DEFAULT, 0)
            )
        );
    }

    public static function add_activity($courseid, $section, $type, $name, $description, $duedate = 0, $timeopen = 0, $timeclose = 0, $maxbytes = 0, $maxfiles = 0) {
        global $DB, $CFG, $USER;

        $params = self::validate_parameters(self::add_activity_parameters(), array(
            'courseid' => $courseid,
            'section' => $section,
            'type' => $type,
            'name' => $name,
            'description' => $description,
            'duedate' => $duedate,
            'timeopen' => $timeopen,
            'timeclose' => $timeclose,
            'maxbytes' => $maxbytes,
            'maxfiles' => $maxfiles
        ));

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('moodle/course:manageactivities', $context);

        $course = $DB->get_record('course', array('id' => $params['courseid']), '*', MUST_EXIST);
        $module = $DB->get_record('modules', array('name' => $params['type']), '*', MUST_EXIST);

        $modlib = "$CFG->dirroot/mod/{$params['type']}/lib.php";
        if (file_exists($modlib)) {
            require_once($modlib);
        } else {
            throw new \moodle_exception("Modul bulunamadi: {$params['type']}");
        }

        course_create_sections_if_missing($course, array($params['section']));
        $modinfo = get_fast_modinfo($course);
        $cw = $modinfo->get_section_info($params['section']);

        if (!$cw) {
            throw new \moodle_exception("Ilgili bolum/hafta bulunamadi.");
        }

        $moduleinfo = new \stdClass();
        $moduleinfo->course = $course->id;
        $moduleinfo->module = $module->id;
        $moduleinfo->section = $params['section'];
        $moduleinfo->visible = 1;
        $moduleinfo->visibleoncoursepage = 1;

        $cmid = add_course_module($moduleinfo);

        $instance = new \stdClass();
        $instance->course = $course->id;
        $instance->name = $params['name'];
        $instance->intro = $params['description'];
        $instance->introformat = FORMAT_HTML;
        $instance->coursemodule = $cmid;
        $instance->section = $params['section'];
        $instance->visible = 1;

        if ($params['type'] === 'assign') {
            $instance->assignsubmission_onlinetext_enabled = 1;
            $instance->assignsubmission_file_enabled = 1;
            $instance->alwaysshowdescription = 1;
            $instance->preventlatesubmissions = 0;
            $instance->submissiondrafts = 0;
            $instance->requiresubmissionstatement = 0;
            
            // Postgres strict kuralları için varsayılanlar
            $instance->sendnotifications = 0;
            $instance->sendlatenotifications = 0;
            $instance->sendstudentnotifications = 1;
            $instance->grade = 100;
            $instance->completionsubmit = 0;
            $instance->duedate = 0;
            $instance->cutoffdate = 0;
            $instance->gradingduedate = 0;
            $instance->allowsubmissionsfromdate = 0;
            $instance->teamsubmission = 0;
            $instance->requireallteammemberssubmit = 0;
            $instance->blindmarking = 0;
            $instance->markingworkflow = 0;
            $instance->markingallocation = 0;

            if ($params['duedate'] > 0) $instance->duedate = $params['duedate'];
            if ($params['maxbytes'] > 0) $instance->maxbytes = $params['maxbytes'];
            if ($params['maxfiles'] > 0) $instance->assignsubmission_file_maxfiles = $params['maxfiles'];
        } elseif ($params['type'] === 'quiz') {
            $defaults = self::get_default_quiz_instance_fields();
            $defaults['timeopen'] = $params['timeopen'];
            $defaults['timeclose'] = $params['timeclose'];
            
            foreach ($defaults as $key => $value) {
                if (!isset($instance->$key)) {
                    $instance->$key = $value;
                }
            }
        } elseif ($params['type'] === 'url') {
            $instance->externalurl = 'https://varsayilan-adres.com'; 
            $instance->display = 0;
        } elseif ($params['type'] === 'page') {
            $instance->content = $params['description'] ?: 'Sayfa icerigi';
            $instance->contentformat = FORMAT_HTML;
            $instance->display = 0;
        } elseif ($params['type'] === 'forum') {
            $instance->type = 'general';
            $instance->assessed = 0;
            $instance->forcesubscribe = 0;
        }

        $addinstancefunction = $params['type'] . '_add_instance';
        if (function_exists($addinstancefunction)) {
            try {
                $instance->id = $addinstancefunction($instance, null);
                $DB->set_field('course_modules', 'instance', $instance->id, array('id' => $cmid));
                course_add_cm_to_section($course, $cmid, $params['section']);
                
                $cm = get_coursemodule_from_id($params['type'], $cmid, $course->id, false, MUST_EXIST);
                \core\event\course_module_created::create_from_cm($cm, $context)->trigger();
                
                rebuild_course_cache($course->id, true);
            } catch (\Exception $e) {
                $DB->delete_records('course_modules', array('id' => $cmid));
                $debuginfo = isset($e->debuginfo) ? $e->debuginfo : '';
                return array('status' => false, 'message' => $e->getMessage() . ' | ' . $debuginfo, 'activityid' => 0);
            }
        } else {
            $DB->delete_records('course_modules', array('id' => $cmid));
            throw new \moodle_exception("Cekirdek fonksiyon bulunamadi: $addinstancefunction");
        }

        return array('status' => true, 'message' => 'Aktivite basariyla eklendi', 'cmid' => (int)$cmid, 'activityid' => (int)$instance->id);
    }

    public static function add_activity_returns() {
        return new external_single_structure(
            array(
                'status' => new external_value(PARAM_BOOL, 'Islem basarili mi?'),
                'message' => new external_value(PARAM_TEXT, 'Durum mesaji'),
                'cmid' => new external_value(PARAM_INT, 'Course Module ID', VALUE_OPTIONAL),
                'activityid' => new external_value(PARAM_INT, 'Aktivite ID', VALUE_OPTIONAL)
            )
        );
    }

    // --- AKTIVITE SILME FONKSIYONLARI (YENI) ---

    public static function delete_activity_parameters() {
        return new external_function_parameters(
            array(
                'cmid' => new external_value(PARAM_INT, 'Course Module ID', VALUE_REQUIRED)
            )
        );
    }

    public static function delete_activity($cmid) {
        global $DB;

        // Parametre dogrulamasi
        $params = self::validate_parameters(self::delete_activity_parameters(), array('cmid' => $cmid));

        // Modul kaydini veritabanindan al
        $cm = get_coursemodule_from_id('', $params['cmid'], 0, false, MUST_EXIST);

        // Yetki kontrolu
        $context = \context_course::instance($cm->course);
        self::validate_context($context);
        require_capability('moodle/course:manageactivities', $context);

        // Moodle cekirdek fonksiyonu ile modulun tamamen silinmesi
        course_delete_module($cm->id);

        // Ders onbelleginin yenilenmesi
        rebuild_course_cache($cm->course, true);

        return array(
            'status' => true,
            'message' => 'Aktivite basariyla silindi.'
        );
    }

    public static function delete_activity_returns() {
        return new external_single_structure(
            array(
                'status' => new external_value(PARAM_BOOL, 'Islem basarili mi?'),
                'message' => new external_value(PARAM_TEXT, 'Durum mesaji')
            )
        );
    }
    
    // --- FAZ 2: Soru Bankasi Okuma ---

    public static function get_question_categories_parameters() {
        return new external_function_parameters(
            array(
                'courseid' => new external_value(PARAM_INT, 'Ders ID', VALUE_REQUIRED)
            )
        );
    }

    public static function get_question_categories($courseid) {
        global $DB;
        $params = self::validate_parameters(self::get_question_categories_parameters(), array('courseid' => $courseid));
        
        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('moodle/question:viewall', $context);
        
        $categories = $DB->get_records('question_categories', array('contextid' => $context->id), 'sortorder ASC');
        
        $result = array();
        foreach ($categories as $cat) {
            $result[] = array(
                'id' => $cat->id,
                'name' => $cat->name,
                'info' => $cat->info,
                'parent' => $cat->parent
            );
        }
        
        return $result;
    }

    public static function get_question_categories_returns() {
        return new \core_external\external_multiple_structure(
            new \core_external\external_single_structure(
                array(
                    'id' => new external_value(PARAM_INT, 'Kategori ID'),
                    'name' => new external_value(PARAM_TEXT, 'Kategori Adi'),
                    'info' => new external_value(PARAM_RAW, 'Aciklama', VALUE_OPTIONAL),
                    'parent' => new external_value(PARAM_INT, 'Ust Kategori ID', VALUE_OPTIONAL)
                )
            )
        );
    }

    public static function get_questions_parameters() {
        return new \core_external\external_function_parameters(
            array(
                'courseid' => new external_value(PARAM_INT, 'Kurs ID'),
                'categoryid' => new external_value(PARAM_INT, 'Kategori ID (opsiyonel)', VALUE_DEFAULT, 0),
                'qtype' => new external_value(PARAM_TEXT, 'Soru tipi (opsiyonel)', VALUE_DEFAULT, ''),
                'searchtext' => new external_value(PARAM_TEXT, 'Arama metni (opsiyonel)', VALUE_DEFAULT, ''),
                'limitfrom' => new external_value(PARAM_INT, 'Baslangic (opsiyonel)', VALUE_DEFAULT, 0),
                'limitnum' => new external_value(PARAM_INT, 'Sayi (opsiyonel)', VALUE_DEFAULT, 0)
            )
        );
    }

    public static function get_questions($courseid, $categoryid = 0, $qtype = '', $searchtext = '', $limitfrom = 0, $limitnum = 0) {
        global $DB;
        $params = self::validate_parameters(self::get_questions_parameters(), array(
            'courseid' => $courseid,
            'categoryid' => $categoryid,
            'qtype' => $qtype,
            'searchtext' => $searchtext,
            'limitfrom' => $limitfrom,
            'limitnum' => $limitnum
        ));
        file_put_contents('/tmp/moodle_debug.log', json_encode($params) . "\n", FILE_APPEND);
        
        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('moodle/question:viewall', $context);
        
        $sql = "SELECT q.*, 0 as in_use 
                FROM {question} q
                JOIN {question_versions} qv ON qv.questionid = q.id
                JOIN {question_bank_entries} qbe ON qbe.id = qv.questionbankentryid
                JOIN {question_categories} qc ON qc.id = qbe.questioncategoryid
                WHERE qc.contextid = :contextid";
                
        $dbparams = array('contextid' => $context->id);
        
        if ($params['categoryid'] > 0) {
            $sql .= " AND qbe.questioncategoryid = :categoryid";
            $dbparams['categoryid'] = $params['categoryid'];
        }
        if (!empty($params['qtype'])) {
            $sql .= " AND q.qtype = :qtype";
            $dbparams['qtype'] = $params['qtype'];
        }
        if (!empty($params['searchtext'])) {
            $sql .= " AND " . $DB->sql_like('q.name', ':searchtext');
            $dbparams['searchtext'] = '%' . $params['searchtext'] . '%';
        }
        
        $totalcount = $DB->count_records_sql("SELECT COUNT(q.id) " . substr($sql, strpos($sql, "FROM")), $dbparams);
        $questions = $DB->get_records_sql($sql, $dbparams, $params['limitfrom'], $params['limitnum']);
        
        $result = array();
        foreach ($questions as $q) {
            $result[] = array(
                'id' => $q->id,
                'name' => $q->name,
                'questiontext' => $q->questiontext,
                'qtype' => $q->qtype,
                'in_use' => ($q->in_use > 0 ? 1 : 0)
            );
        }
        
        $res = array(
            'totalcount' => $totalcount,
            'questions' => $result
        );
        file_put_contents('/tmp/moodle_debug.log', json_encode($res) . "\n", FILE_APPEND);
        return $res;
    }

    public static function get_questions_returns() {
        return new \core_external\external_single_structure(
            array(
                'totalcount' => new external_value(PARAM_INT, 'Toplam Soru Sayisi'),
                'questions' => new \core_external\external_multiple_structure(
                    new \core_external\external_single_structure(
                        array(
                            'id' => new external_value(PARAM_INT, 'Soru ID'),
                            'name' => new external_value(PARAM_TEXT, 'Soru adi', VALUE_OPTIONAL),
                            'questiontext' => new external_value(PARAM_RAW, 'Soru icerigi', VALUE_OPTIONAL),
                            'qtype' => new external_value(PARAM_TEXT, 'Soru tipi', VALUE_OPTIONAL),
                            'in_use' => new external_value(PARAM_INT, 'Soru kullanimda mi', VALUE_OPTIONAL)
                        )
                    )
                )
            )
        );
    }
    
    // --- FAZ 3: Quiz Soru Ekleme ---
    
    public static function add_quiz_question_parameters() {
        return new external_function_parameters(
            array(
                'cmid' => new external_value(PARAM_INT, 'Quiz Course Module ID', VALUE_REQUIRED),
                'questionid' => new external_value(PARAM_INT, 'Soru ID', VALUE_REQUIRED),
                'page' => new external_value(PARAM_INT, 'Sayfa Numarasi', VALUE_DEFAULT, 1),
                'maxmark' => new external_value(PARAM_FLOAT, 'Soru Puani', VALUE_DEFAULT, 1.0)
            )
        );
    }

    public static function add_quiz_question($cmid, $questionid, $page = 1, $maxmark = 1.0) {
        global $DB, $CFG;
        require_once($CFG->dirroot . '/mod/quiz/locallib.php');
        
        $params = self::validate_parameters(self::add_quiz_question_parameters(), array(
            'cmid' => $cmid,
            'questionid' => $questionid,
            'page' => $page,
            'maxmark' => $maxmark
        ));
        
        $cm = get_coursemodule_from_id('quiz', $params['cmid'], 0, false, MUST_EXIST);
        $quiz = $DB->get_record('quiz', array('id' => $cm->instance), '*', MUST_EXIST);
        
        $context = \context_module::instance($cm->id);
        self::validate_context($context);
        require_capability('mod/quiz:manage', $context);
        
        try {
            quiz_add_quiz_question($params['questionid'], $quiz, $params['page'], $params['maxmark']);
            
            // Moodle 4.0+ için sumgrades ve quiz_grade_items güncellemesi:
            if (class_exists('\mod_quiz\quiz_settings') && class_exists('\mod_quiz\grade_calculator')) {
                $quizobj = \mod_quiz\quiz_settings::create($quiz->id);
                $calculator = \mod_quiz\grade_calculator::create($quizobj);
                $calculator->recompute_quiz_sumgrades();
                $calculator->recompute_all_attempt_sumgrades();
                $calculator->recompute_all_final_grades();
            } else {
                // Eski versiyonlar için fallback
                @quiz_update_sumgrades($quiz);
                @quiz_update_all_attempt_sumgrades($quiz);
                @quiz_update_all_final_grades($quiz);
            }
            quiz_update_grades($quiz, 0, true);

            return array('status' => true, 'message' => 'Soru basariyla eklendi');
        } catch (\Throwable $e) {
            $debuginfo = isset($e->debuginfo) ? $e->debuginfo : '';
            return array('status' => false, 'message' => $e->getMessage() . ' | ' . $debuginfo);
        }
    }

    public static function add_quiz_question_returns() {
        return new external_single_structure(
            array(
                'status' => new external_value(PARAM_BOOL, 'Islem basarili mi?'),
                'message' => new external_value(PARAM_TEXT, 'Durum mesaji')
            )
        );
    }
    
    // --- FAZ 4: Quiz Override Ekleme ---

    public static function add_quiz_override_parameters() {
        return new external_function_parameters(
            array(
                'cmid' => new external_value(PARAM_INT, 'Quiz Course Module ID', VALUE_REQUIRED),
                'groupid' => new external_value(PARAM_INT, 'Grup ID (varsa)', VALUE_DEFAULT, 0),
                'userid' => new external_value(PARAM_INT, 'Kullanici ID (varsa)', VALUE_DEFAULT, 0),
                'timeopen' => new external_value(PARAM_INT, 'Acilis Zamani', VALUE_DEFAULT, 0),
                'timeclose' => new external_value(PARAM_INT, 'Kapanis Zamani', VALUE_DEFAULT, 0),
                'timelimit' => new external_value(PARAM_INT, 'Zaman Siniri', VALUE_DEFAULT, 0),
                'attempts' => new external_value(PARAM_INT, 'Hak Sayisi', VALUE_DEFAULT, 0)
            )
        );
    }

    public static function add_quiz_override($cmid, $groupid = 0, $userid = 0, $timeopen = 0, $timeclose = 0, $timelimit = 0, $attempts = 0) {
        global $DB, $CFG;
        require_once($CFG->dirroot . '/mod/quiz/locallib.php');
        
        $params = self::validate_parameters(self::add_quiz_override_parameters(), array(
            'cmid' => $cmid,
            'groupid' => $groupid,
            'userid' => $userid,
            'timeopen' => $timeopen,
            'timeclose' => $timeclose,
            'timelimit' => $timelimit,
            'attempts' => $attempts
        ));
        
        $cm = get_coursemodule_from_id('quiz', $params['cmid'], 0, false, MUST_EXIST);
        $quiz = $DB->get_record('quiz', array('id' => $cm->instance), '*', MUST_EXIST);
        
        $context = \context_module::instance($cm->id);
        self::validate_context($context);
        require_capability('mod/quiz:manage', $context);
        
        $override = new \stdClass();
        $override->quiz = $quiz->id;
        if ($params['groupid'] > 0) {
            $override->groupid = $params['groupid'];
        } elseif ($params['userid'] > 0) {
            $override->userid = $params['userid'];
        } else {
            return array('status' => false, 'message' => 'Grup veya Kullanici ID gereklidir');
        }
        
        if ($params['timeopen'] > 0) $override->timeopen = $params['timeopen'];
        if ($params['timeclose'] > 0) $override->timeclose = $params['timeclose'];
        if ($params['timelimit'] > 0) $override->timelimit = $params['timelimit'];
        if ($params['attempts'] > 0) $override->attempts = $params['attempts'];
        
        try {
            $DB->insert_record('quiz_overrides', $override);
            quiz_update_events($quiz);
            return array('status' => true, 'message' => 'Override basariyla eklendi');
        } catch (\Exception $e) {
            $debuginfo = isset($e->debuginfo) ? $e->debuginfo : '';
            return array('status' => false, 'message' => $e->getMessage() . ' | ' . $debuginfo);
        }
    }

    public static function add_quiz_override_returns() {
        return new external_single_structure(
            array(
                'status' => new external_value(PARAM_BOOL, 'Islem basarili mi?'),
                'message' => new external_value(PARAM_TEXT, 'Durum mesaji')
            )
        );
    }
    
    // --- FAZ 5: Yayinlama ---

    public static function set_coursemodule_visible_parameters() {
        return new external_function_parameters(
            array(
                'cmid' => new external_value(PARAM_INT, 'Course Module ID', VALUE_REQUIRED),
                'visible' => new external_value(PARAM_INT, 'Gorunurluk (1/0)', VALUE_REQUIRED)
            )
        );
    }

    public static function set_coursemodule_visible($cmid, $visible) {
        global $CFG;
        require_once($CFG->dirroot . '/course/lib.php');
        
        $params = self::validate_parameters(self::set_coursemodule_visible_parameters(), array(
            'cmid' => $cmid,
            'visible' => $visible
        ));
        
        $cm = get_coursemodule_from_id('', $params['cmid'], 0, false, MUST_EXIST);
        $context = \context_module::instance($cm->id);
        self::validate_context($context);
        require_capability('moodle/course:manageactivities', $context);
        
        set_coursemodule_visible($cm->id, $params['visible']);
        rebuild_course_cache($cm->course, true);
        
        return array('status' => true, 'message' => 'Gorunurluk guncellendi');
    }

    public static function set_coursemodule_visible_returns() {
        return new external_single_structure(
            array(
                'status' => new external_value(PARAM_BOOL, 'Islem basarili mi?'),
                'message' => new external_value(PARAM_TEXT, 'Durum mesaji')
            )
        );
    }
    // --- FAZ 5: Quiz Sorularini Goruntuleme ---
    public static function get_quiz_slots_parameters() {
        return new external_function_parameters(
            array(
                'cmid' => new external_value(PARAM_INT, 'Quiz Course Module ID', VALUE_REQUIRED)
            )
        );
    }

    public static function get_quiz_slots($cmid) {
        global $DB;
        $params = self::validate_parameters(self::get_quiz_slots_parameters(), array('cmid' => $cmid));
        $cm = get_coursemodule_from_id('quiz', $params['cmid'], 0, false, MUST_EXIST);
        $context = context_module::instance($cm->id);
        self::validate_context($context);
        require_capability('mod/quiz:view', $context);
        
        $sql = "SELECT qs.id, qs.slot, qs.maxmark, q.id as questionid, q.qtype, q.name, q.questiontext 
                FROM {quiz_slots} qs
                JOIN {question_references} qr ON qr.itemid = qs.id AND qr.component = 'mod_quiz' AND qr.questionarea = 'slot'
                JOIN {question_bank_entries} qbe ON qbe.id = qr.questionbankentryid
                JOIN {question_versions} qv ON qv.questionbankentryid = qbe.id
                JOIN {question} q ON q.id = qv.questionid
                WHERE qs.quizid = ?
                ORDER BY qs.slot ASC";
        
        $slots = $DB->get_records_sql($sql, array($cm->instance));
        $result = array();
        if ($slots) {
            foreach ($slots as $slot) {
                $result[] = array(
                    'slot' => $slot->slot,
                    'maxmark' => $slot->maxmark,
                    'questionid' => $slot->questionid,
                    'qtype' => $slot->qtype,
                    'name' => $slot->name,
                    'questiontext' => $slot->questiontext
                );
            }
        }
        
        // Fallback for older Moodle versions if qr is empty
        if (empty($result)) {
            $sql2 = "SELECT qs.id, qs.slot, qs.maxmark, q.id as questionid, q.qtype, q.name, q.questiontext 
                     FROM {quiz_slots} qs
                     JOIN {question} q ON q.id = qs.questionid
                     WHERE qs.quizid = ?
                     ORDER BY qs.slot ASC";
            $slots2 = $DB->get_records_sql($sql2, array($cm->instance));
            if ($slots2) {
                foreach ($slots2 as $slot) {
                    $result[] = array(
                        'slot' => $slot->slot,
                        'maxmark' => $slot->maxmark,
                        'questionid' => $slot->questionid,
                        'qtype' => $slot->qtype,
                        'name' => $slot->name,
                        'questiontext' => $slot->questiontext
                    );
                }
            }
        }
        
        return $result;
    }

    public static function get_quiz_slots_returns() {
        return new external_multiple_structure(
            new external_single_structure(
                array(
                    'slot' => new external_value(PARAM_INT, 'Slot number'),
                    'maxmark' => new external_value(PARAM_FLOAT, 'Max mark'),
                    'questionid' => new external_value(PARAM_INT, 'Question ID'),
                    'qtype' => new external_value(PARAM_TEXT, 'Question type'),
                    'name' => new external_value(PARAM_TEXT, 'Question name'),
                    'questiontext' => new external_value(PARAM_RAW, 'Question text'),
                )
            )
        );
    }
}
