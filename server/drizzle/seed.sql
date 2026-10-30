-- Amboss Database Seed Script
-- Materials, Machines, and Electronics Catalog

-- ==============================================================================
-- Materials
-- ==============================================================================
INSERT INTO materials (slug, name, type, density_g_cm3, cost_per_gram_lkr, tag, requires_enclosure, is_active) VALUES ('pla-plus', 'PLA+', 'FDM', 1.240, 20.00, 'Standard', false, true);
INSERT INTO materials (slug, name, type, density_g_cm3, cost_per_gram_lkr, tag, requires_enclosure, is_active) VALUES ('petg', 'PETG', 'FDM', 1.270, 22.00, 'Durable', false, true);
INSERT INTO materials (slug, name, type, density_g_cm3, cost_per_gram_lkr, tag, requires_enclosure, is_active) VALUES ('abs', 'ABS', 'FDM', 1.040, 25.00, 'Heat-Resistant', true, true);
INSERT INTO materials (slug, name, type, density_g_cm3, cost_per_gram_lkr, tag, requires_enclosure, is_active) VALUES ('tpu', 'TPU', 'FDM', 1.210, 35.00, 'Flexible', false, true);
INSERT INTO materials (slug, name, type, density_g_cm3, cost_per_gram_lkr, tag, requires_enclosure, is_active) VALUES ('petg-cf', 'PETG-CF', 'FDM', 1.290, 35.00, 'Carbon Fiber', true, true);
INSERT INTO materials (slug, name, type, density_g_cm3, cost_per_gram_lkr, tag, requires_enclosure, is_active) VALUES ('lite-resin', 'Lite Resin', 'SLA', 1.150, 35.00, 'SLA Detail', false, true);
INSERT INTO materials (slug, name, type, density_g_cm3, cost_per_gram_lkr, tag, requires_enclosure, is_active) VALUES ('high-clear-resin', 'Clear Resin', 'SLA', 1.150, 40.00, 'SLA Clear', false, true);

-- ==============================================================================
-- Machines
-- ==============================================================================
INSERT INTO machines (slug, name, type, build_x_mm, build_y_mm, build_z_mm, is_enclosed, hourly_rate_lkr, is_online) VALUES ('creality-k2-plus', 'Creality K2 Plus', 'FDM', 350, 350, 350, true, 160.00, true);
INSERT INTO machines (slug, name, type, build_x_mm, build_y_mm, build_z_mm, is_enclosed, hourly_rate_lkr, is_online) VALUES ('elegoo-centauri-carbon', 'Elegoo Centauri Carbon', 'FDM', 256, 256, 256, true, 160.00, true);
INSERT INTO machines (slug, name, type, build_x_mm, build_y_mm, build_z_mm, is_enclosed, hourly_rate_lkr, is_online) VALUES ('bambu-lab-a1', 'Bambu Lab A1', 'FDM', 256, 256, 256, false, 160.00, true);
INSERT INTO machines (slug, name, type, build_x_mm, build_y_mm, build_z_mm, is_enclosed, hourly_rate_lkr, is_online) VALUES ('bambu-lab-a1-mini', 'Bambu Lab A1 Mini', 'FDM', 180, 180, 180, false, 160.00, true);
INSERT INTO machines (slug, name, type, build_x_mm, build_y_mm, build_z_mm, is_enclosed, hourly_rate_lkr, is_online) VALUES ('elegoo-saturn-4-ultra', 'Elegoo Saturn 4 Ultra 16K', 'SLA', 211, 118, 220, true, 250.00, true);

-- ==============================================================================
-- Electronics Catalog (Products)
-- ==============================================================================
INSERT INTO products (sku, name, category, description, price_lkr, stock_quantity, image_url, is_active) VALUES ('MCU-ARDUINO-UNO-R3', 'Arduino Uno R3 DIP', 'microcontrollers', 'Atmega328P microcontroller with removable DIP chip, 14 digital I/O pins (6 PWM), 6 analog inputs, 16 MHz resonator.', 1400.00, 49, 'images/Arduino-DIP.png', true);
INSERT INTO products (sku, name, category, description, price_lkr, stock_quantity, image_url, is_active) VALUES ('MCU-ESP32-WROOM-32D', 'ESP32 NodeMCU-32S', 'microcontrollers', 'ESP-WROOM-32 module featuring dual-core CPU, built-in Wi-Fi and Bluetooth, 38 GPIO pins.', 1450.00, 48, 'images/ESP32.png', true);
INSERT INTO products (sku, name, category, description, price_lkr, stock_quantity, image_url, is_active) VALUES ('ACC-ARDUINO-USB-CABLE', 'Arduino Uno USB Cable', 'accessories', 'USB type A to USB type B programming and heavy-duty power transfer cable.', 130.00, 39, 'images/Arduino-USB.png', true);
INSERT INTO products (sku, name, category, description, price_lkr, stock_quantity, image_url, is_active) VALUES ('PAS-10K-POTENTIOMETER', '10K 20mm Mono Potentiometer', 'accessories', 'Single-channel (mono) variable resistor with 10,000 ohms total resistance and 20mm knurled shaft.', 30.00, 150, 'images/10k-20-mm-potentiometer.png', true);
INSERT INTO products (sku, name, category, description, price_lkr, stock_quantity, image_url, is_active) VALUES ('SEN-HC-SR04-ULTRASONIC', 'Ultrasonic Sensor (HC-SR04)', 'sensors', '4-pin ultrasound sensor for detecting objects within 2 cm to 400 cm range with high precision.', 240.00, 39, 'images/Ultrasonic-Sensor.png', true);
INSERT INTO products (sku, name, category, description, price_lkr, stock_quantity, image_url, is_active) VALUES ('SEN-IR-MH-FLYING-FISH', 'IR Sensor (MH Flying Fish)', 'sensors', '3-pin infrared obstacle avoidance module for detecting objects within a 2–40 cm range.', 125.00, 32, 'images/IR-Sensor.png', true);
INSERT INTO products (sku, name, category, description, price_lkr, stock_quantity, image_url, is_active) VALUES ('PRT-GL12-BREADBOARD-840', 'GL-12 breadboard', 'prototyping', '830-840 tie-point, white solderless project board used for prototyping electronic circuits.', 230.00, 50, 'images/Arduino-DIPProject-Board.png', true);
INSERT INTO products (sku, name, category, description, price_lkr, stock_quantity, image_url, is_active) VALUES ('ACC-AEC-SOLDER-ROLL-50G', 'AEC Solder Roll 1mm 50g 60/40', 'accessories', 'Tin-lead (60/40) rosin core solder wire for clean, high-conductivity joints.', 500.00, 20, 'images/Solder-50g.png', true);
INSERT INTO products (sku, name, category, description, price_lkr, stock_quantity, image_url, is_active) VALUES ('PAS-LED-3MM-RED', 'LED 3mm - Red', 'accessories', 'Standard diffused red 3mm indicator LED (forward voltage 1.8V - 2.2V).', 5.00, 500, 'images/LED.png', true);
INSERT INTO products (sku, name, category, description, price_lkr, stock_quantity, image_url, is_active) VALUES ('PAS-LED-3MM-GREEN', 'LED 3mm - Green', 'accessories', 'Standard diffused green 3mm indicator LED (forward voltage 2.0V - 2.4V).', 5.00, 500, 'images/LED.png', true);
INSERT INTO products (sku, name, category, description, price_lkr, stock_quantity, image_url, is_active) VALUES ('PAS-RESISTORS-1-4W-10PK', 'Resistors, 1/4W, 10 pack', 'accessories', '10-pack 1/4W axial metal film resistors. Message us for the specific values you want.', 30.00, 50, 'images/1_4-W-Resistors.png', true);
INSERT INTO products (sku, name, category, description, price_lkr, stock_quantity, image_url, is_active) VALUES ('SEN-GY521-MPU6050', '6-axis motion tracking sensor (GY-521)', 'sensors', 'MPU-6050 chip integrating 3-axis accelerometer and 3-axis gyroscope with standard I2C.', 650.00, 0, 'images/MPU6050-GY-521.png', true);
INSERT INTO products (sku, name, category, description, price_lkr, stock_quantity, image_url, is_active) VALUES ('PRT-JUMPER-WIRES-MM', 'Jumper Cables - Male-Male', 'prototyping', 'Sets of 40 flexible multi-color 20cm male-to-male DuPont wires.', 180.00, 57, 'images/Jumper-cables.png', true);
INSERT INTO products (sku, name, category, description, price_lkr, stock_quantity, image_url, is_active) VALUES ('PRT-JUMPER-WIRES-MF', 'Jumper Cables - Male-Female', 'prototyping', 'Sets of 40 flexible multi-color 20cm male-to-female DuPont wires.', 180.00, 57, 'images/Jumper-cables.png', true);
INSERT INTO products (sku, name, category, description, price_lkr, stock_quantity, image_url, is_active) VALUES ('PRT-JUMPER-WIRES-FF', 'Jumper Cables - Female-Female', 'prototyping', 'Sets of 40 flexible multi-color 20cm female-to-female DuPont wires.', 180.00, 57, 'images/Jumper-cables.png', true);
