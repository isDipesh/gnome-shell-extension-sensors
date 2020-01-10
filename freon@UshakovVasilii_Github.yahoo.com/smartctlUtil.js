const GLib = imports.gi.GLib;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const ByteArray = imports.byteArray;
function getSmartData (argv){
    const smartctl = GLib.find_program_in_path('smartctl')
    return JSON.parse(ByteArray.toString( GLib.spawn_command_line_sync(`${smartctl} ${argv} -j`)[1] ))
}

var smartctlUtil  = class {
    constructor(callback) {
        this._smartDevices = [];
        try {
            this._smartDevices = getSmartData("--scan")["devices"]
	    global.log('[FREON] test devices: ' + e);
        } catch (e) {
            global.log('[FREON] Unable to find smart devices: ' + e);
        }        
        this._updated = true;
    }

    get available(){
        return this._smartDevices.length > 0;
    }

    get updated (){
       return this._updated;
    }

    set updated (updated){
        this._updated = updated;
    }

    get temp() {
        return this._smartDevices.map(device => {
            return {
                label: getSmartData(`--info ${device["name"]}`)["model_name"],
                temp: parseFloat(getSmartData(`--attributes ${device["name"]}`).temperature.current)
            }
        })
    }

    destroy(callback) {
        this._smartDevices = [];
    }

    execute(callback) {
        this._updated = true;
    }

};
