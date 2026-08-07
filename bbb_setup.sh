#!/bin/bash

# Ensure running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root"
  exit
fi

# 1. Update bbb-html5.yml
cat << 'EOF' > /etc/bigbluebutton/bbb-html5.yml
public:
  app:
    branding:
      logo: "https://aku.edu.tr/wp-content/uploads/2020/02/aku_logo_yazisiz.png"
  theme:
    primary: '#184361'
EOF

# 2. Update Welcome Message
sed -i 's/^defaultWelcomeMessage=.*/defaultWelcomeMessage=Akuzem Canlı Ders Sistemine Hoş Geldiniz! Lütfen derste kameralarınızı açmayı unutmayın./' /usr/share/bbb-web/WEB-INF/classes/bigbluebutton.properties

# 3. Apply changes by restarting BBB
bbb-conf --restart
