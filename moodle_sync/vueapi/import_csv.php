<?php
define("AJAX_SCRIPT", true);
require_once(__DIR__ . "/../../config.php");
require_once($CFG->dirroot . "/webservice/lib.php");
require_once($CFG->dirroot . "/question/editlib.php");
require_once($CFG->dirroot . "/question/format.php");
require_once($CFG->dirroot . "/question/format/aiken/format.php");
require_once($CFG->dirroot . "/question/format/gift/format.php");

$token = required_param("wstoken", PARAM_ALPHANUM);
$courseid = required_param("courseid", PARAM_INT);
$filetext = required_param("aiken", PARAM_RAW); // still keeping 'aiken' param name for backwards compatibility, but it could be gift text
$qformat_type = optional_param("qformat", "aiken", PARAM_ALPHA);
$categoryname = optional_param("categoryname", "", PARAM_TEXT);

try {
    $webservicelib = new webservice();
    $webservicelib->authenticate_user($token);

    $context = context_course::instance($courseid);
    require_capability("moodle/question:add", $context);

    global $DB;

    $category = null;
    if (!empty($categoryname)) {
        // Kategoriyi isme göre ara
        $existing_cat = $DB->get_record('question_categories', array('name' => $categoryname, 'contextid' => $context->id));
        if ($existing_cat) {
            $category = $existing_cat;
        } else {
            // Yoksa oluştur
            $defaultcategory = question_get_default_category($context->id);
            if (!$defaultcategory) {
                question_make_default_categories(array($context));
                $defaultcategory = question_get_default_category($context->id);
            }
            $newcat = new stdClass();
            $newcat->name = $categoryname;
            $newcat->contextid = $context->id;
            $newcat->parent = $defaultcategory ? $defaultcategory->id : 0;
            $newcat->info = '';
            $newcat->stamp = make_unique_id_code();
            $newcat->id = $DB->insert_record('question_categories', $newcat);
            $category = $newcat;
        }
    } else {
        $category = question_get_default_category($context->id);
        if (!$category) {
            // Eğer kategori henüz oluşturulmamışsa otomatik oluştur
            question_make_default_categories(array($context));
            $category = question_get_default_category($context->id);
            
            if (!$category) {
                throw new Exception("Ders için varsayılan soru kategorisi bulunamadı ve otomatik olarak oluşturulamadı.");
            }
        }
    }

    $tmpfile = tempnam(sys_get_temp_dir(), $qformat_type);
    file_put_contents($tmpfile, $filetext);

    if ($qformat_type === "gift") {
        $qformat = new qformat_gift();
    } else {
        $qformat = new qformat_aiken();
    }
    $qformat->setCategory($category);
    $qformat->setContexts([$context]);
    
    // Moodle 4.x qformat_default uses ->filename
    $qformat->setFilename($tmpfile); 
    $qformat->displayprogress = false;

    global $DB, $USER;
    
    $time_before_import = time();

    ob_start(); // hide the HTML output
    if (!$qformat->importprocess($tmpfile)) {
        ob_end_clean();
        throw new Exception("Soru içe aktarma başarısız oldu. Format hatalı olabilir.");
    }
    ob_end_clean();
    
    unlink($tmpfile);

    // Zaman tabanlı ve kullanıcı tabanlı sorgu ile race condition önlemi
    $newqs = $DB->get_records_sql("SELECT id FROM {question} WHERE timecreated >= ? AND createdby = ? ORDER BY id ASC", [$time_before_import - 5, $USER->id]);
    
    $created_ids = [];
    if ($newqs) {
        foreach ($newqs as $q) {
            $created_ids[] = $q->id;
            // Moodle 4.0+ için taslaktan hazıra çek:
            $DB->execute("UPDATE {question_versions} SET status = 'ready' WHERE questionid = ?", array($q->id));
        }
    }

    echo json_encode(["status" => true, "message" => "Sorular başarıyla içe aktarıldı.", "question_ids" => $created_ids]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(["status" => false, "message" => $e->getMessage()]);
}
