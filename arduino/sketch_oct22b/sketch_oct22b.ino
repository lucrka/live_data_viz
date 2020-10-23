
#include <Wire.h>
#include <Adafruit_MPL3115A2.h>
#include "Adafruit_HTU21DF.h"
#include <Adafruit_Sensor.h>
#include <Adafruit_HMC5883_U.h>

Adafruit_MPL3115A2 baro = Adafruit_MPL3115A2();
float altm, pascals;

Adafruit_HMC5883_Unified mag = Adafruit_HMC5883_Unified(12345);   
class Mag{
  public:
  float x;
  float y;
  float z;
};

Mag mag_data;
float deg;

Adafruit_HTU21DF hum = Adafruit_HTU21DF();
float temp, rel_hum;


void setup() {
  // put your setup code here, to run once:
  Serial.begin(19200);
  if (!hum.begin() || ! baro.begin()) {
    Serial.println("Couldn't find sensor!");
    while (1);
  }
}

void loop() {
  // magnetometer
  sensors_event_t event; 
  mag.getEvent(&event);

  mag_data.x = event.magnetic.x;
  mag_data.y = event.magnetic.y;
  mag_data.z = event.magnetic.z;

  // barometer
//  pascals = baro.getPressure();
//  altm = baro.getAltitude();

//  // temperature & humidity
  temp = hum.readTemperature();
  rel_hum = hum.readHumidity();

  //serial output
  Serial.print(mag_data.x);Serial.print(", ");
  Serial.print(mag_data.y);Serial.print(", ");
  Serial.print(mag_data.z);Serial.print(", ");
//  Serial.print(pascals);Serial.print(", ");
//  Serial.print(altm);Serial.print(", ");
  Serial.print(temp);Serial.print(", ");
  Serial.println(rel_hum);
  
  //10Hz beat
  delay(10); 
}
