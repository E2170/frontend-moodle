<?php
define("AJAX_SCRIPT", true);
require_once(__DIR__ . "/../../config.php");
require_once($CFG->dirroot . "/webservice/lib.php");
require_once($CFG->dirroot . "/question/editlib.php");
require_once($CFG->dirroot . "/question/format.php");
require_once($CFG->dirroot . "/question/format/aiken/format.php");

$token = required_param("wstoken", PARAM_ALPHANUM);
$courseid = required_param("courseid", PARAM_INT);
$aikentext = required_param("aiken", PARAM_RAW);

try {
    $webservicelib = new webservice();
    $webservicelib->authenticate_user($token);

    $context = context_course::instance($courseid);
    require_capability("moodle/question:add", $context);

    $category = question_get_default_category($context->id);
    if (!$category) {
        // Eğer kategori henüz oluşturulmamışsa (örneğin hoca hiç soru bankasına girmemişse) otomatik oluştur
        question_make_default_categories(array($context));
        $category = question_get_default_category($context->id);
        
        if (!$category) {
            throw new Exception("Ders için varsayılan soru kategorisi bulunamadı ve otomatik olarak oluşturulamadı.");
        }
    }

    $tmpfile = tempnam(sys_get_temp_dir(), "aiken");
    file_put_contents($tmpfile, $aikentext);

    $qformat = new qformat_aiken();
    $qformat->setCategory($category);
    $qformat->setContexts([$context]);
    
    // Moodle 4.x qformat_default uses ->filename
    $qformat->setFilename($tmpfile); 
    $qformat->displayprogress = false;

    ob_start(); // hide the HTML output
    if (!$qformat->importprocess($tmpfile)) {
        ob_end_clean();
        throw new Exception("Soru içe aktarma başarısız oldu. Format hatalı olabilir.");
    }
    ob_end_clean();
    
    unlink($tmpfile);

    // Get the number of questions we tried to import
    $lines = explode("\n", $aikentext);
    $questions = $qformat->readquestions($lines);
    $qcount = count($questions);
    
    $created_ids = [];
    if ($qcount > 0) {
        global $DB, $USER;
        $newqs = $DB->get_records_sql("SELECT id FROM {question} WHERE createdby = ? ORDER BY id DESC LIMIT ?", [$USER->id, $qcount]);
        if ($newqs) {
            foreach ($newqs as $q) {
                $created_ids[] = $q->id;
                // Moodle 4.0+ için taslaktan hazıra çek:
                $DB->execute("UPDATE {question_versions} SET status = 'ready' WHERE questionid = ?", array($q->id));
            }
            $created_ids = array_reverse($created_ids);
        }
    }

    echo json_encode(["status" => true, "message" => "Sorular başarıyla içe aktarıldı.", "question_ids" => $created_ids]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(["status" => false, "message" => $e->getMessage()]);
}
