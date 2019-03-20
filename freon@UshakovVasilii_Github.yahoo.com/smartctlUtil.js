const GLib = imports.gi.GLib;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const CommandLineUtil = Me.imports.commandLineUtil;

var smartctlUtil = class extends CommandLineUtil.CommandLineUtil {

    constructor() {
        super();
        let path = GLib.find_program_in_path('smartctl');
        this._argv = path ? [path, '-x', '/dev/nvme0'] : null;
    }

    get temp() {
        if(!this._output)
            return [];

        let smartctlOutput = [];
        smartctlOutput = this._output;

        let sensors = [];

        let slabel="Temperature Sensor";
        for (let line of smartctlOutput) {
            let matchModel = /Model Number:/.exec( line.toString() );
            if(matchModel){
               let sline=line.split(/\s+/);
               slabel=sline.slice(2).join(" ");
            }
            //let line = "Temperature Sensor 1:               37 Celsius"
            let match = /Temperature Sensor \d: *\w\d Celsius/.exec( line.toString() );
            //let match = /Use smartctl.*/.exec( line.toString() );
            //let match = /.*\[Temperature Sensor \d: .*\d Celcius.*/.exec(line.toString());
            if(match){
               let sline=line.split(/\s+/);
               let sensor = { label: slabel+" "+sline[2][0], temp: parseFloat(sline[3]) };
               sensors.push(sensor);
            }
        }
        return sensors;

    }

    get available(){
        return true;
    }

};
