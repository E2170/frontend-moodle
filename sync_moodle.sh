#!/bin/bash
export SSHPASS='q1w2e3r4'
IPS=(
  "192.168.1.175"
  "192.168.1.176"
  "192.168.1.178"
  "192.168.1.171"
  "192.168.1.190"
  "192.168.1.191"
)

for IP in "${IPS[@]}"; do
  echo "Syncing to $IP..."
  sshpass -e scp -o StrictHostKeyChecking=no -r /var/www/akuzem/moodle_sync/vueapi root@$IP:/var/www/moodle/local/
  sshpass -e scp -o StrictHostKeyChecking=no /var/www/akuzem/moodle_sync/bbb_view.php root@$IP:/var/www/moodle/mod/bigbluebuttonbn/
  sshpass -e ssh -o StrictHostKeyChecking=no root@$IP "chown -R www-data:www-data /var/www/moodle/local/vueapi /var/www/moodle/mod/bigbluebuttonbn/bbb_view.php"
  echo "Done with $IP."
done
