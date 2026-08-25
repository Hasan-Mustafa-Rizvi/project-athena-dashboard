#include <Wire.h>
#include <Adafruit_BMP085.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <ArduinoJson.h>

// Project Athena ESP32 telemetry firmware
// SDA=21, SCL=22
// NOTE:
// - Yaw is gyro-integrated and drifts over time (MPU6050 has no magnetometer).
// - Altitude is reported as relative delta from startup baseline, not absolute AMSL.
// - Battery is null because no voltage divider/sensing circuit is wired in this build.

static const uint8_t I2C_SDA_PIN = 21;
static const uint8_t I2C_SCL_PIN = 22;
static const uint32_t SERIAL_BAUD = 115200;
static const uint32_t OUTPUT_PERIOD_MS = 100; // 10 Hz JSON output
static const float SEA_LEVEL_PRESSURE_PA = 101325.0f;
static const uint32_t CALIBRATION_DURATION_MS = 3500;
static const float COMPLEMENTARY_ALPHA = 0.96f; // Higher favors gyro, lower favors accel.
static const float ALTITUDE_EMA_ALPHA = 0.22f;  // Light smoothing for BMP180 altitude.
static const float YAW_RATE_DEADBAND_DPS = 0.35f;

Adafruit_MPU6050 mpu;
Adafruit_BMP085 bmp;

bool mpuReady = false;
bool bmpReady = false;
bool calibrationReady = false;

uint32_t sequenceCounter = 0;
uint32_t lastOutputMs = 0;
uint32_t lastIntegrationMs = 0;
uint32_t calibrationStartMs = 0;

int calibrationSamples = 0;
float calibrationRollSum = 0.0f;
float calibrationPitchSum = 0.0f;
float calibrationAltitudeSum = 0.0f;

float yawDeg = 0.0f;
float gyroZBiasDps = 0.0f;
float rollOffsetDeg = 0.0f;
float pitchOffsetDeg = 0.0f;
float homeAltitudeM = 0.0f;
float filteredRollDeg = 0.0f;
float filteredPitchDeg = 0.0f;
float filteredAltitudeAbsM = 0.0f;

float normalize360(float deg) {
  while (deg >= 360.0f) deg -= 360.0f;
  while (deg < 0.0f) deg += 360.0f;
  return deg;
}

float radToDeg(float rad) {
  return rad * 57.2957795f;
}

float calibrateGyroZBias() {
  const int samples = 300;
  float sum = 0.0f;
  sensors_event_t a, g, t;

  for (int i = 0; i < samples; i++) {
    if (mpu.getEvent(&a, &g, &t)) {
      const float gzDps = radToDeg(g.gyro.z);
      sum += gzDps;
    }
    delay(5);
  }
  return sum / samples;
}

void setup() {
  Serial.begin(SERIAL_BAUD);
  delay(200);
  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);

  mpuReady = mpu.begin();
  if (mpuReady) {
    mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
    mpu.setGyroRange(MPU6050_RANGE_500_DEG);
    mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
    gyroZBiasDps = calibrateGyroZBias();
  }

  bmpReady = bmp.begin();

  lastIntegrationMs = millis();
  lastOutputMs = millis();
  calibrationStartMs = millis();
}

void loop() {
  const uint32_t nowMs = millis();
  const float dt = max(0.001f, (nowMs - lastIntegrationMs) / 1000.0f);
  lastIntegrationMs = nowMs;

  float accelX = 0.0f;
  float accelY = 0.0f;
  float accelZ = 0.0f;
  float gyroX = 0.0f;
  float gyroY = 0.0f;
  float gyroZ = 0.0f;
  float yawRateDps = 0.0f;
  float accelRollDeg = 0.0f;
  float accelPitchDeg = 0.0f;
  float outputRollDeg = 0.0f;
  float outputPitchDeg = 0.0f;
  float imuQuality = 0.0f;

  if (mpuReady) {
    sensors_event_t a, g, t;
    if (mpu.getEvent(&a, &g, &t)) {
      accelX = a.acceleration.x;
      accelY = a.acceleration.y;
      accelZ = a.acceleration.z;
      gyroX = g.gyro.x;
      gyroY = g.gyro.y;
      gyroZ = g.gyro.z;

      const float gyroXDps = radToDeg(gyroX);
      const float gyroYDps = radToDeg(gyroY);
      yawRateDps = radToDeg(gyroZ) - gyroZBiasDps;
      if (fabsf(yawRateDps) < YAW_RATE_DEADBAND_DPS) {
        yawRateDps = 0.0f;
      }

      accelRollDeg = atan2f(accelY, accelZ) * 57.2957795f;
      accelPitchDeg = atan2f(-accelX, sqrtf(accelY * accelY + accelZ * accelZ)) * 57.2957795f;

      const float gyroRollPred = filteredRollDeg + gyroXDps * dt;
      const float gyroPitchPred = filteredPitchDeg + gyroYDps * dt;
      filteredRollDeg = COMPLEMENTARY_ALPHA * gyroRollPred + (1.0f - COMPLEMENTARY_ALPHA) * accelRollDeg;
      filteredPitchDeg = COMPLEMENTARY_ALPHA * gyroPitchPred + (1.0f - COMPLEMENTARY_ALPHA) * accelPitchDeg;

      if (!calibrationReady) {
        yawDeg = 0.0f;
      } else {
        yawDeg = normalize360(yawDeg + yawRateDps * dt);
      }

      const float accelMag = sqrtf(accelX * accelX + accelY * accelY + accelZ * accelZ);
      const float accelError = fabsf(accelMag - 9.81f);
      imuQuality = 100.0f - min(100.0f, accelError * 15.0f);
    }
  }

  float temperatureC = 0.0f;
  float pressurePa = 0.0f;
  float rawAltitudeAbsM = 0.0f;

  if (bmpReady) {
    temperatureC = bmp.readTemperature();
    pressurePa = bmp.readPressure();
    rawAltitudeAbsM = bmp.readAltitude(SEA_LEVEL_PRESSURE_PA);

    if (sequenceCounter == 0) {
      filteredAltitudeAbsM = rawAltitudeAbsM;
    } else {
      filteredAltitudeAbsM =
          ALTITUDE_EMA_ALPHA * rawAltitudeAbsM + (1.0f - ALTITUDE_EMA_ALPHA) * filteredAltitudeAbsM;
    }
  } else {
    filteredAltitudeAbsM = 0.0f;
  }

  if (!calibrationReady) {
    calibrationSamples++;
    calibrationRollSum += filteredRollDeg;
    calibrationPitchSum += filteredPitchDeg;
    calibrationAltitudeSum += filteredAltitudeAbsM;

    if (nowMs - calibrationStartMs >= CALIBRATION_DURATION_MS) {
      if (calibrationSamples > 0) {
        rollOffsetDeg = calibrationRollSum / calibrationSamples;
        pitchOffsetDeg = calibrationPitchSum / calibrationSamples;
        homeAltitudeM = calibrationAltitudeSum / calibrationSamples;
      } else {
        rollOffsetDeg = filteredRollDeg;
        pitchOffsetDeg = filteredPitchDeg;
        homeAltitudeM = filteredAltitudeAbsM;
      }
      yawDeg = 0.0f;
      calibrationReady = true;
    }
  }

  outputRollDeg = calibrationReady ? (filteredRollDeg - rollOffsetDeg) : 0.0f;
  outputPitchDeg = calibrationReady ? (filteredPitchDeg - pitchOffsetDeg) : 0.0f;
  const float relativeAltitudeM = calibrationReady ? (filteredAltitudeAbsM - homeAltitudeM) : 0.0f;

  if (nowMs - lastOutputMs >= OUTPUT_PERIOD_MS) {
    lastOutputMs = nowMs;
    sequenceCounter++;

    StaticJsonDocument<640> doc;
    doc["source"] = "esp32";
    doc["vehicle_id"] = "ATHENA-HW-001";
    doc["sequence"] = sequenceCounter;
    doc["timestamp_ms"] = nowMs;
    doc["roll"] = outputRollDeg;
    doc["pitch"] = outputPitchDeg;
    doc["yaw"] = yawDeg;
    doc["yaw_rate"] = yawRateDps;
    doc["gyro_x"] = gyroX;
    doc["gyro_y"] = gyroY;
    doc["gyro_z"] = gyroZ;
    doc["accel_x"] = accelX;
    doc["accel_y"] = accelY;
    doc["accel_z"] = accelZ;
    doc["temperature"] = temperatureC;
    doc["pressure"] = pressurePa;
    doc["altitude"] = relativeAltitudeM;
    doc["imu_quality"] = imuQuality;
    doc["signal"] = 100;
    doc["battery"] = nullptr;
    doc["heading_is_estimated"] = true;
    doc["altitude_is_relative"] = true;
    doc["battery_available"] = false;
    doc["calibration_status"] = calibrationReady ? "ready" : "calibrating";
    doc["calibration_samples"] = calibrationSamples;
    doc["imu_ok"] = mpuReady;
    doc["baro_ok"] = bmpReady;

    serializeJson(doc, Serial);
    Serial.println();
  }
}
