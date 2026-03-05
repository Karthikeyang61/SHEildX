# SHEild X

SHEild X is a women safety device built using ESP32, BLE and GSM.

The device allows users to trigger emergency alerts using a button or through a mobile app.

## Features

- SOS alert via GSM
- BLE communication with mobile app
- Emergency location sharing
- Double press SOS trigger
- Triple press cancel system
- Two-stage alert system
- LED alert indication

## Hardware Used

- ESP32
- SIM800 GSM module
- Push Button
- LED Indicator
- Mobile App (BLE)

## Working

1. User presses the button twice.
2. Device starts a 10 second cancel window.
3. If not cancelled, GSM sends SOS message.
4. A second window allows cancelling police alert.
5. Location can also be requested via BLE.

## Technologies Used

- ESP32
- Bluetooth Low Energy (BLE)
- GSM (SIM800)
- Arduino C++

## Mobile Application

The mobile application connects to the device using Bluetooth Low Energy (BLE).

Functions:
- Receive SOS alerts
- Request location from device
- Send emergency commands

The mobile app source code is available in the `mobile-app` folder.

## Project Type

Embedded System + IoT Women Safety Device
