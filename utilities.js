const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const St = imports.gi.St;
const Lang = imports.lang;
const Gettext = imports.gettext.domain('gse-sensors');
const _ = Gettext.gettext;

function detectSensors() {
    return [GLib.find_program_in_path('sensors')];
}

function detectHDDTemp() {
    let hddtempArgv = GLib.find_program_in_path('hddtemp');
    if(hddtempArgv) {
        // check if this user can run hddtemp directly.
        if(!GLib.spawn_command_line_sync(hddtempArgv)[3])
            return [hddtempArgv];
    }

    // doesn't seem to be the case… is it running as a daemon?
    let pid = GLib.spawn_command_line_sync("pidof hddtemp");
    if(pid[1].length) {
        let r;
        // get daemon command line
        let cmdline = GLib.spawn_command_line_sync("ps --pid=" + pid[1] + " -o args=")[1].toString();
        // get port or assume default
        let port = (r=/(-p\W*|--port=)(\d{1,5})/.exec(cmdline)) ? parseInt(r[2]) : 7634;
        // use net cat to get data
        let nc = GLib.find_program_in_path('nc');
        if(nc)
            return [nc, 'localhost', port.toString()];
    }

    // not found
    return [];
}

function parseSensorsOutput(txt,parser) {
    let sensors_output = txt.split("\n");
    let feature_label = undefined;
    let feature_value = undefined;
    let sensors = new Array();
    //iterate through each lines
    for(let i = 0; i < sensors_output.length; i++){
        // ignore chipset driver name and 'Adapter:' line for now
        i += 2;
        // get every feature of the chip
        while(sensors_output[i]){
           // if it is not a continutation of a feature line
           if(sensors_output[i].indexOf(' ') != 0){
              let feature = parser(feature_label, feature_value);
              if (feature){
                  sensors.push(feature);
                  feature = undefined;
              }
              [feature_label, feature_value] = sensors_output[i].split(':');
           }
           else{
              feature_value += sensors_output[i];
           }
           i++;
        }
    }
    let feature = parser(feature_label, feature_value);
    if (feature) {
        sensors.push(feature);
        feature = undefined;
    }
    return sensors;
}

function parseSensorsTemperatureLine(label, value) {
    let sensor = undefined;
    if(label != undefined && value != undefined) {
        let curValue = value.trim().split('  ')[0];
        // does the current value look like a temperature unit (°C)?
        if(curValue.indexOf("C", curValue.length - "C".length) !== -1){
            sensor = new Array();
            let r;
            sensor['label'] = label.trim();
            sensor['temp'] = parseFloat(curValue.split(' ')[0]);
            sensor['low']  = (r = /low=\+(\d{1,3}.\d)/.exec(value))  ? parseFloat(r[1]) : undefined;
            sensor['high'] = (r = /high=\+(\d{1,3}.\d)/.exec(value)) ? parseFloat(r[1]) : undefined;
            sensor['crit'] = (r = /crit=\+(\d{1,3}.\d)/.exec(value)) ? parseFloat(r[1]) : undefined;
            sensor['hyst'] = (r = /hyst=\+(\d{1,3}.\d)/.exec(value)) ? parseFloat(r[1]) : undefined;
        }
    }
    return sensor;
}

function parseFanRPMLine(label, value) {
    let sensor = undefined;
    if(label != undefined && value != undefined) {
        let curValue = value.trim().split('  ')[0];
        // does the current value look like a fan rpm line?
        if(curValue.indexOf("RPM", curValue.length - "RPM".length) !== -1){
            sensor = new Array();
            let r;
            sensor['label'] = label.trim();
            sensor['rpm'] = parseFloat(curValue.split(' ')[0]);
            sensor['min'] = (r = /min=(\d{1,5})/.exec(value)) ? parseFloat(r[1]) : undefined;
        }
    }
    return sensor;
}

function parseVoltageLine(label, value) {
    let sensor = undefined;
    if(label != undefined && value != undefined) {
        let curValue = value.trim().split('  ')[0];
        // does the current value look like a voltage line?
        if(curValue.indexOf("V", curValue.length - "V".length) !== -1){
            sensor = new Array();
            let r;
            sensor['label'] = label.trim();
            sensor['volt'] = parseFloat(curValue.split(' ')[0]);
            sensor['min'] = (r = /min=(\d{1,3}.\d)/.exec(value)) ? parseFloat(r[1]) : undefined;
            sensor['max'] = (r = /max=(\d{1,3}.\d)/.exec(value)) ? parseFloat(r[1]) : undefined;
        }
    }
    return sensor;
}

function parseHddTempOutput(txt, sep) {
    let hddtemp_output = txt.split("\n").filter(function(e){ return e; });
    let sensors = new Array();
    for each(line in hddtemp_output)
    {
        let sensor = new Array();
        let fields = line.split(sep).filter(function(e){ return e; });
        sensor['label'] = _('Drive %s').format(fields[0].split('/').pop());
        sensor['temp'] = parseFloat(fields[2]);
        sensors.push(sensor);
    }
    return sensors;
}

function filterTemperature(tempInfo) {
    return tempInfo['temp'] > 0 && tempInfo['temp'] < 115;
}

function filterFan(fanInfo) {
    return fanInfo['rpm'] > 0;
}

function filterVoltage(voltageInfo) {
    return true;
}
