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

        



