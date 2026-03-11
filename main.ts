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
    function send_ack(cmd_name: any, status: any) {
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
        
    }
    
}

