<?php
define('CLI_SCRIPT', true);
require_once(__DIR__ . '/config.php');

global $DB;

$categories = $DB->get_records('question_categories');
$deleted_count = 0;

foreach ($categories as $cat) {
    if ($cat->parent != 0) {
        $count = 0;
        if ($DB->get_manager()->table_exists('question_bank_entries')) {
            $count = $DB->count_records('question_bank_entries', array('questioncategoryid' => $cat->id));
        } else {
            $count = $DB->count_records('question', array('category' => $cat->id));
        }

        if ($count == 0) {
            $DB->delete_records('question_categories', array('id' => $cat->id));
            $deleted_count++;
            echo "Deleted empty category ID: " . $cat->id . " Name: " . $cat->name . "\n";
        }
    }
}

echo "Cleanup complete. Deleted $deleted_count empty categories.\n";
