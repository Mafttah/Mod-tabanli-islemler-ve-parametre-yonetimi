radio.set_group(42)
satellite_id = 1
current_mode = "STANDBY"

# ---- PARAMETRELER ----
sample_rate = 5000      
temp_threshold = 30      
light_threshold = 100    
# ---- BUFFER DEGISKENLERI ----
MAX_BUFFER = 10
data_buffer = ["", "", "", "", "", "", "", "", "", ""]
buffer_count = 0

def on_forever():
    # ---- ACK FONKSIYONU ----
    def send_ack(cmd_name, status):
        ack = "A:" + str(satellite_id) + ":" + cmd_name + ":" + status
        radio.send_string(ack)

    # ---- SLEEP MODU ----
    def mode_sleep():
        basic.clear_screen()   # Ekrani temizle, LED'leri kapate

    # ---- STANDBY MODU ----
    def mode_standby():
        # Sicaklik ve isik seviyesini oku
        temp = input.temperature()
        light_level = input.light_level()

        # Verileri serial monitore yazdir
        serial.write_line("STANDBY | Temp: " + str(temp) + "C | Light: " + str(light_level))

        # Ekranda ikon goster
        basic.show_icon(IconNames.DIAMOND)

    # ---- COLLECT MODU ----
    def mode_collect():
        global buffer_count

        # Sicaklik ve isik seviyesini oku
        temp = input.temperature()
        light_level = input.light_level()

        # Veriyi "sicaklik-isik" string formatinda olustur
        sample = str(temp) + ":" + str(light_level)

        if buffer_count < MAX_BUFFER:
            data_buffer[buffer_count] = sample
            buffer_count += 1
            serial.write_line("COLLECT | Buffer[" + str(buffer_count) + "/" + str(MAX_BUFFER) + "]: " + sample)
        if buffer_count >= MAX_BUFFER:
            serial.write_line("COLLECT | Buffer dolu! TRANSMIT moduna geciliyor...")
            change_mode("TRANSMIT")

    # ---- TRANSMIT MODU ----
    def mode_transmit():
        global buffer_count
        temp = input.temperature()
        light_level = input.light_level()
        live_msg = "S:" + str(satellite_id) + ":" + str(temp) + ":" + str(light_level)
        radio.send_string(live_msg)
        serial.write_line("TRANSMIT | Canli: " + live_msg)
        i = 0
        while i < buffer_count:
            buffered_msg = "S:" + str(satellite_id) + ":" + data_buffer[i]
            radio.send_string(buffered_msg)
            serial.write_line("TRANSMIT | Buffer[" + str(i) + "]: " + buffered_msg)
            i += 1

        # Buffer'i bosalt
        if buffer_count > 0:
            serial.write_line("TRANSMIT | Buffer bosaltildi (" + str(buffer_count) + " kayit gonderildi).")
        buffer_count = 0

    def change_mode(new_mode):
        global current_mode

        if current_mode == new_mode:
            serial.write_line("MOD DEGISIMI: Zaten " + new_mode + " modundasin.")
            return

        # Modu degistir
        old_mode = current_mode
        current_mode = new_mode
        serial.write_line("MOD DEGISIMI: " + old_mode + " -> " + current_mode)

        send_ack("MODE", current_mode)

    def handle_param_command(param_name, param_value):
        global sample_rate, temp_threshold, light_threshold

        if param_name == "RATE":
            sample_rate = int(param_value)
            serial.write_line("PARAM | RATE guncellendi: " + str(sample_rate) + "ms")
            send_ack("PARAM:RATE", "OK")

        elif param_name == "TEMP_THRESHOLD":
            temp_threshold = int(param_value)
            serial.write_line("PARAM | TEMP_THRESHOLD guncellendi: " + str(temp_threshold) + " derece")
            send_ack("PARAM:TEMP_THRESHOLD", "OK")

        elif param_name == "LIGHT_THRESHOLD":
            light_threshold = int(param_value)
            serial.write_line("PARAM | LIGHT_THRESHOLD guncellendi: " + str(light_threshold))
            send_ack("PARAM:LIGHT_THRESHOLD", "OK")

        else:
            serial.write_line("PARAM | Bilinmeyen parametre: " + param_name)
            send_ack("PARAM:" + param_name, "ERROR")

    def on_received_string(receivedString):
        if not receivedString.startswith("CMD"):
            return

        parts = receivedString.split(":")

        if len(parts) < 3:
            return

        if parts[1] != str(satellite_id):
            return

        cmd_type = parts[2]

        if cmd_type == "MODE" and len(parts) >= 4:
            new_mode = parts[3]
            change_mode(new_mode)

        elif cmd_type == "PARAM" and len(parts) >= 5:
            param_name = parts[3]
            param_value = parts[4]
            handle_param_command(param_name, param_value)

        else:
            serial.write_line("MESAJ | Tanimsiz komut: " + receivedString)

    radio.on_received_string(on_received_string)

    def on_button_pressed_a():
        serial.write_line("========== GUNCEL PARAMETRELER ==========")
        serial.write_line("Mod           : " + current_mode)
        serial.write_line("RATE          : " + str(sample_rate) + " ms")
        serial.write_line("TEMP_THRESHOLD: " + str(temp_threshold) + " derece")
        serial.write_line("LIGHT_THRESHOLD: " + str(light_threshold))
        serial.write_line("Buffer Kayit  : " + str(buffer_count) + "/" + str(MAX_BUFFER))
        serial.write_line("=========================================")

    input.on_button_pressed(Button.A, on_button_pressed_a)

    def on_forever():
        if current_mode == "SLEEP":
            mode_sleep()
            basic.pause(70000)

        elif current_mode == "STANDBY":
            mode_standby()
            basic.pause(15000)

        elif current_mode == "COLLECT":
            mode_collect()
            basic.pause(4000)

        elif current_mode == "TRANSMIT":
            mode_transmit()
            basic.pause(7000)

    basic.forever(on_forever)
    basic.show_string("HW3")
basic.forever(on_forever)



        



