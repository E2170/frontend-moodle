<?php
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "https://moodle.argeyazilim.tr/local/vueapi/get_recordings.php?token=fa57430e559fea765a3b8e62d05fec17&cmid=141&bbbid=47"); // Using admin token from earlier
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$res = curl_exec($ch);
curl_close($ch);
echo $res;
