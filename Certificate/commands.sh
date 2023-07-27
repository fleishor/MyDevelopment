openssl genrsa -out FleisHor.CA.key 4096
openssl req -x509 -new -nodes -key FleisHor.CA.key -sha256 -days 390 -out FleisHor.CA.crt -subj "/C=DE/ST=BY/O=FleisHor/CN=FleisHor.CA"

sudo cp FleisHor.CA.crt /usr/local/share/ca-certificates/FleisHor.CA.crt
sudo update-ca-certificates
awk -v cmd='openssl x509 -noout -subject' '/BEGIN/{close(cmd)};{print | cmd}' < /etc/ssl/certs/ca-certificates.crt | grep FleisHor.CA

openssl genrsa -out docker.fritz.box.key 4096
openssl req -new -key docker.fritz.box.key -out docker.fritz.box.csr -subj "/C=DE/ST=BY/O=FleisHor/CN=docker.fritz.box"
openssl x509 -req -in docker.fritz.box.csr -CA FleisHor.CA.crt -CAkey FleisHor.CA.key -CAcreateserial -out docker.fritz.box.crt -days 390 -sha256 -extfile docker.fritz.box.ext

chmod 644 *.key

rm ssl-bundle.crt
cat docker.fritz.box.crt FleisHor.CA.crt >> ssl-bundle.crt

sudo -u nginx cp ./docker.fritz.box.key ../../nginx/etc_ssl/
sudo -u nginx cp ./ssl-bundle.crt ../../nginx/etc_ssl/

sudo -u vaultwarden cp ./docker.fritz.box.key ../../vaultwarden/etc_ssl/
sudo -u vaultwarden cp ./ssl-bundle.crt ../../vaultwarden/etc_ssl/

sudo cp ./ssl-bundle.crt /etc/ssl/

