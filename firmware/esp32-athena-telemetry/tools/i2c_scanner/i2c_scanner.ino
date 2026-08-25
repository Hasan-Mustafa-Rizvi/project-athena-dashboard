#include <Wire.h>

static const uint8_t I2C_SDA_PIN = 21;
static const uint8_t I2C_SCL_PIN = 22;

void setup() {
  Serial.begin(115200);
  delay(200);
  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
  Serial.println("ATHENA I2C scanner started");
}

void loop() {
  byte found = 0;
  for (byte address = 1; address < 127; address++) {
    Wire.beginTransmission(address);
    byte error = Wire.endTransmission();
    if (error == 0) {
      Serial.print("I2C device at 0x");
      if (address < 16) Serial.print("0");
      Serial.println(address, HEX);
      found++;
    }
  }
  if (found == 0) {
    Serial.println("No I2C devices found");
  }
  Serial.println("---");
  delay(2000);
}
