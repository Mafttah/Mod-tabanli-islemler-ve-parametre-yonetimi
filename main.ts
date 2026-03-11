radio.setGroup(42)
let satellite_id = 1
let current_mode = "STANDBY"
//  ---- PARAMETRELER ----
let sample_rate = 5000
let temp_threshold = 30
let light_threshold = 100
//  ---- BUFFER DEGISKENLERI ----
let MAX_BUFFER = 10
let data_buffer = ["", "", "", "", "", "", "", "", "", ""]
let buffer_count = 0
function on_forever() {
    //  ---- ACK FONKSIYONU ----
    function send_ack(cmd_name: string, status: string) {
        let ack = "A:" + ("" + satellite_id) + ":" + cmd_name + ":" + status
        radio.sendString(ack)
    }
    
    //  ---- SLEEP MODU ----
    function mode_sleep() {
        basic.clearScreen()
    }
    
    //  Ekrani temizle, LED'leri kapate
    //  ---- STANDBY MODU ----
    function mode_standby() {
        //  Sicaklik ve isik seviyesini oku
        let temp = input.temperature()
        let light_level = input.lightLevel()
        //  Verileri serial monitore yazdir
        serial.writeLine("STANDBY | Temp: " + ("" + temp) + "C | Light: " + ("" + light_level))
        //  Ekranda ikon goster
        basic.showIcon(IconNames.Diamond)
    }
    
    //  ---- COLLECT MODU ----
    function mode_collect() {
        
        //  Sicaklik ve isik seviyesini oku
        let temp = input.temperature()
        let light_level = input.lightLevel()
        //  Veriyi "sicaklik-isik" string formatinda olustur
        let sample = "" + temp + ":" + ("" + light_level)
        if (buffer_count < MAX_BUFFER) {
            data_buffer[buffer_count] = sample
            buffer_count += 1
            serial.writeLine("COLLECT | Buffer[" + ("" + buffer_count) + "/" + ("" + MAX_BUFFER) + "]: " + sample)
        }
        
        if (buffer_count >= MAX_BUFFER) {
            serial.writeLine("COLLECT | Buffer dolu! TRANSMIT moduna geciliyor...")
            change_mode("TRANSMIT")
        }
        
    }
    
    //  ---- TRANSMIT MODU ----
    function mode_transmit() {
        let buffered_msg: string;
        
        let temp = input.temperature()
        let light_level = input.lightLevel()
        let live_msg = "S:" + ("" + satellite_id) + ":" + ("" + temp) + ":" + ("" + light_level)
        radio.sendString(live_msg)
        serial.writeLine("TRANSMIT | Canli: " + live_msg)
        let i = 0
        while (i < buffer_count) {
            buffered_msg = "S:" + ("" + satellite_id) + ":" + data_buffer[i]
            radio.sendString(buffered_msg)
            serial.writeLine("TRANSMIT | Buffer[" + ("" + i) + "]: " + buffered_msg)
            i += 1
        }
        //  Buffer'i bosalt
        if (buffer_count > 0) {
            serial.writeLine("TRANSMIT | Buffer bosaltildi (" + ("" + buffer_count) + " kayit gonderildi).")
        }
        
        buffer_count = 0
    }
    
    function change_mode(new_mode: string) {
        
        if (current_mode == new_mode) {
            serial.writeLine("MOD DEGISIMI: Zaten " + new_mode + " modundasin.")
            return
        }
        
        //  Modu degistir
        let old_mode = current_mode
        current_mode = new_mode
        serial.writeLine("MOD DEGISIMI: " + old_mode + " -> " + current_mode)
        send_ack("MODE", current_mode)
    }
    
    function handle_param_command(param_name: string, param_value: string) {
        
        if (param_name == "RATE") {
            sample_rate = parseInt(param_value)
            serial.writeLine("PARAM | RATE guncellendi: " + ("" + sample_rate) + "ms")
            send_ack("PARAM:RATE", "OK")
        } else if (param_name == "TEMP_THRESHOLD") {
            temp_threshold = parseInt(param_value)
            serial.writeLine("PARAM | TEMP_THRESHOLD guncellendi: " + ("" + temp_threshold) + " derece")
            send_ack("PARAM:TEMP_THRESHOLD", "OK")
        } else if (param_name == "LIGHT_THRESHOLD") {
            light_threshold = parseInt(param_value)
            serial.writeLine("PARAM | LIGHT_THRESHOLD guncellendi: " + ("" + light_threshold))
            send_ack("PARAM:LIGHT_THRESHOLD", "OK")
        } else {
            serial.writeLine("PARAM | Bilinmeyen parametre: " + param_name)
            send_ack("PARAM:" + param_name, "ERROR")
        }
        
    }
    
    radio.onReceivedString(function on_received_string(receivedString: string) {
        let new_mode: string;
        let param_name: string;
        let param_value: string;
        if (!_py.py_string_startswith(receivedString, "CMD")) {
            return
        }
        
        let parts = _py.py_string_split(receivedString, ":")
        if (parts.length < 3) {
            return
        }
        
        if (parts[1] != "" + satellite_id) {
            return
        }
        
        let cmd_type = parts[2]
        if (cmd_type == "MODE" && parts.length >= 4) {
            new_mode = parts[3]
            change_mode(new_mode)
        } else if (cmd_type == "PARAM" && parts.length >= 5) {
            param_name = parts[3]
            param_value = parts[4]
            handle_param_command(param_name, param_value)
        } else {
            serial.writeLine("MESAJ | Tanimsiz komut: " + receivedString)
        }
        
    })
    input.onButtonPressed(Button.A, function on_button_pressed_a() {
        serial.writeLine("========== GUNCEL PARAMETRELER ==========")
        serial.writeLine("Mod           : " + current_mode)
        serial.writeLine("RATE          : " + ("" + sample_rate) + " ms")
        serial.writeLine("TEMP_THRESHOLD: " + ("" + temp_threshold) + " derece")
        serial.writeLine("LIGHT_THRESHOLD: " + ("" + light_threshold))
        serial.writeLine("Buffer Kayit  : " + ("" + buffer_count) + "/" + ("" + MAX_BUFFER))
        serial.writeLine("=========================================")
    })
}

