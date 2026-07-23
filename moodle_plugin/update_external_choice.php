<?php
$file = '/var/www/akuzem/moodle_plugin/external.php';
$content = file_get_contents($file);

$choice_code = <<<'EOD'
        } elseif ($params['type'] === 'choice') {
            $instance->option = array();
            if (isset($params['choice_options']) && is_array($params['choice_options'])) {
                foreach ($params['choice_options'] as $opt) {
                    if (trim($opt) !== '') {
                        $instance->option[] = $opt;
                    }
                }
            }
            if (empty($instance->option)) {
                $instance->option = array('Evet', 'Hayır'); // varsayılan
            }
EOD;

$content = str_replace("        } elseif (\$params['type'] === 'forum') {", $choice_code . "\n        } elseif (\$params['type'] === 'forum') {", $content);

file_put_contents($file, $content);
echo "Updated external.php for choice options.\n";
